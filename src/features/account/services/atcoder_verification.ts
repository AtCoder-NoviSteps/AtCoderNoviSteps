import { default as db } from '$lib/server/database';
import { sha256 } from '$lib/utils/hash';

const EXTERNAL_API_TIMEOUT_MS = 5000;

/** Calls the external API to check if the validation code appears in the user's AtCoder affiliation. */
async function confirmWithExternalApi(handle: string, validationCode: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);

  try {
    const baseUrl = process.env.CONFIRM_API_URL;
    if (!baseUrl) {
      throw new Error('CONFIRM_API_URL is not set.');
    }
    const url = `${baseUrl}?user=${encodeURIComponent(handle)}`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    try {
      const jsonData = await response.json();
      if (!Array.isArray(jsonData.contents)) {
        return false;
      }
      return jsonData.contents.some((item: unknown) => item === validationCode);
    } catch {
      // Invalid JSON from external API — treat as unconfirmed
      return false;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates a SHA256 validation code, stores it in AtCoderAccount, and returns the code.
 * Creates the AtCoderAccount record if it does not exist yet.
 */
export async function generate(username: string, handle: string): Promise<string> {
  const date = new Date().toISOString();
  const validationCode = await sha256(username + date);

  const user = await db.user.findUniqueOrThrow({ where: { username } });

  await db.atCoderAccount.upsert({
    where: { userId: user.id },
    create: { userId: user.id, handle, validationCode, isValidated: false },
    update: { handle, validationCode, isValidated: false },
  });

  return validationCode;
}

/**
 * Checks the external API and, if confirmed, marks the AtCoderAccount as validated.
 * @returns true if validation succeeded, false otherwise.
 */
export async function validate(username: string): Promise<boolean> {
  const user = await db.user.findUniqueOrThrow({
    where: { username },
    include: { atCoderAccount: true },
  });

  if (!user.atCoderAccount) {
    return false;
  }

  if (!user.atCoderAccount.validationCode) {
    return false;
  }

  let confirmed: boolean;

  try {
    confirmed = await confirmWithExternalApi(
      user.atCoderAccount.handle,
      user.atCoderAccount.validationCode,
    );
  } catch (error) {
    throw new Error('Failed to confirm AtCoder affiliation', { cause: error });
  }

  if (!confirmed) {
    return false;
  }

  await db.atCoderAccount.update({
    where: { userId: user.id },
    data: { validationCode: '', isValidated: true },
  });

  return true;
}

/** Deletes the AtCoderAccount record, effectively resetting the verification state. */
export async function reset(username: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { username } });
  // deleteMany is intentional: delete throws if no record exists (user may not have an AtCoderAccount)
  await db.atCoderAccount.deleteMany({ where: { userId: user.id } });
}
