export const HOME_PAGE = `/`;
export const ABOUT_PAGE = `/about`;
export const SIGNUP_PAGE = `/signup`;
export const LOGIN_PAGE = `/login`;
export const WORKBOOKS_PAGE = `/workbooks`;
export const PROBLEMS_PAGE = `/problems`;

// For Admin
export const IMPORTING_PROBLEMS_PAGE = `/tasks`;
export const TAGS_PAGE = `/tags`;
export const ACCOUNT_TRANSFER_PAGE = `/account_transfer`;

export const navbarLinks = [
  { title: `ホーム`, path: HOME_PAGE },
  { title: `問題集（アルファ版）`, path: WORKBOOKS_PAGE },
  { title: `問題一覧`, path: PROBLEMS_PAGE },
  { title: `サービスの説明`, path: ABOUT_PAGE },
];

export const navbarDashboardLinks = [
  { title: `問題のインポート`, path: IMPORTING_PROBLEMS_PAGE },
  { title: `問題一覧`, path: PROBLEMS_PAGE },
  { title: `問題集`, path: WORKBOOKS_PAGE },
  { title: `タグ一覧`, path: TAGS_PAGE },
  { title: `アカウント移行`, path: ACCOUNT_TRANSFER_PAGE },
];
