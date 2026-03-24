export const HOME_PAGE = `/`;
export const ABOUT_PAGE = `/about`;
export const SIGNUP_PAGE = `/signup`;
export const LOGIN_PAGE = `/login`;
export const FORGOT_PASSWORD_PAGE = `/forgot_password`;
export const WORKBOOKS_PAGE = `/workbooks`;
export const PROBLEMS_PAGE = `/problems`;
export const VOTES_PAGE = `/votes`;

// For Admin
export const IMPORTING_PROBLEMS_PAGE = `/tasks`;
export const TAGS_PAGE = `/tags`;
export const ACCOUNT_TRANSFER_PAGE = `/account_transfer`;
export const WORKBOOKS_ORDER_PAGE = `/workbooks/order`;
export const VOTE_MANAGEMENT_PAGE = `/vote_management`;

export const navbarLinks = [
  { title: `ホーム`, path: HOME_PAGE },
  { title: `問題集`, path: WORKBOOKS_PAGE },
  { title: `一覧表`, path: PROBLEMS_PAGE },
  { title: `グレード投票`, path: VOTES_PAGE },
  { title: `サービスの説明`, path: ABOUT_PAGE },
];

export const navbarDashboardLinks = [
  { title: `問題のインポート`, path: IMPORTING_PROBLEMS_PAGE },
  { title: `一覧表`, path: PROBLEMS_PAGE },
  { title: `問題集`, path: WORKBOOKS_PAGE },
  { title: `問題集（並び替え）`, path: WORKBOOKS_ORDER_PAGE },
  { title: `タグ一覧`, path: TAGS_PAGE },
  { title: `アカウント移行`, path: ACCOUNT_TRANSFER_PAGE },
  { title: `投票管理`, path: VOTE_MANAGEMENT_PAGE },
];
