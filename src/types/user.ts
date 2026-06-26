export interface User {
  id: number;
  name: string;
}

// 認証済みユーザー（GET /current_user・OAuth 交換時）。Rails が role を含めて返す。
// コメント投稿者など一般の User 参照は role を持たないため別型にしている。
// role の値域は Rails の enum に追従（確定したら union に絞ってよい）。
export interface AuthUser extends User {
  role: string;
}
