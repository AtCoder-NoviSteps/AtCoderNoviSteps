"""Rewrite alias specifiers to package.json subpath imports with an explicit extension.

Usage: python3 -I codemod_subpath_imports.py <repo-root> <lib|features>

- lib:      `$lib/...` -> `#lib/...`
- features: `$features/...` and `@/features/...` -> `#features/...`

The rewrite is idempotent, so it can be re-run on a branch after rebasing onto the change.
"""
import os
import re
import sys

root = sys.argv[1]
target = sys.argv[2]

# (specifier prefix, source directory relative to the root, replacement prefix)
RULES = {
    'lib': [('$lib/', 'src/lib', '#lib/')],
    'features': [
        ('$features/', 'src/features', '#features/'),
        ('@/features/', 'src/features', '#features/'),
    ],
}

if target not in RULES:
    sys.exit(f'unknown target: {target} (expected one of {", ".join(RULES)})')

rules = [
    (re.compile(r"""(['"])""" + re.escape(prefix) + r"""([^'"]+)\1"""), os.path.join(root, source), replacement)
    for prefix, source, replacement in RULES[target]
]

unresolved = []
changed_files = 0
changed_specs = 0
file_changes = 0
current_file = ''


def resolve(base_dir, path):
    # a `.js` specifier is kept as is because TypeScript and Vite map it to the `.ts` source;
    # other existing files keep their extension (e.g. `.svelte` components)
    if path.endswith('.js') or os.path.isfile(os.path.join(base_dir, path)):
        return path
    # `x.svelte` that only exists as `x.svelte.ts` is a runes module and becomes `x.svelte.js`
    candidates = [
        (path + '.ts', path + '.js'),
        (path + '.svelte.ts', path + '.svelte.js'),
        (path + '/index.ts', path + '/index.js'),
        (path + '.js', path + '.js'),
    ]
    for source, specifier in candidates:
        if os.path.isfile(os.path.join(base_dir, source)):
            return specifier
    return None


def make_replacer(base_dir, replacement):
    def replace_specifier(match):
        global changed_specs, file_changes
        resolved = resolve(base_dir, match.group(2))
        if resolved is None:
            unresolved.append((current_file, match.group(0)))
            return match.group(0)
        file_changes += 1
        changed_specs += 1
        return f'{match.group(1)}{replacement}{resolved}{match.group(1)}'

    return replace_specifier


for base in ('src', 'e2e', 'prisma'):
    for dirpath, dirnames, filenames in os.walk(os.path.join(root, base)):
        dirnames[:] = [name for name in dirnames if name not in ('node_modules', '.svelte-kit')]
        for filename in filenames:
            if not filename.endswith(('.ts', '.svelte', '.js')):
                continue
            full = os.path.join(dirpath, filename)
            current_file = os.path.relpath(full, root)
            text = open(full, encoding='utf-8').read()
            file_changes = 0
            new_text = text
            for pattern, base_dir, replacement in rules:
                new_text = pattern.sub(make_replacer(base_dir, replacement), new_text)
            if file_changes:
                open(full, 'w', encoding='utf-8').write(new_text)
                changed_files += 1

print(f'files changed: {changed_files}, specifiers changed: {changed_specs}, unresolved: {len(unresolved)}')
for item in unresolved:
    print('UNRESOLVED', item)
