#!/usr/bin/env bash
#
# 実 Rails API のレスポンス構造を、フロントの契約正本である fixtures
# (src/lib/api/__tests__/fixtures/*.json) と自動で突き合わせる。
# docs/api-contract-checklist.md の ① を「ワンコマンド」で回すための補助。
#
# 比較方法:
#   各レスポンスを「値を無視したキーパスの集合」に正規化し、fixture と diff する。
#   - MISSING : fixture にあって実レスポンスに無いキー（命名ズレ / フィールド欠落の疑い）
#               ※ 空配列のときは中身のキーパスが出ないため MISSING に出る（誤検知に注意）
#   - EXTRA   : 実レスポンスにあって fixture に無いキー（Rails が追加したフィールド）
#
# 使い方:
#   bin/rails server -p 3001  # 別ターミナルで Rails を起動しておく
#   ./scripts/verify-api-contract.sh
#
# 環境変数:
#   BASE       既定 http://localhost:3001/api/v1
#   JWT        指定すると認証必須エンドポイント(current_user 等)も検証
#   GID/TID    詳細で叩く greentea_id / temple_id（既定 1 / 3）
#   LAT/LNG/RADIUS  nearby 用（既定 35.0036 / 135.7752 / 1500）

set -uo pipefail

BASE="${BASE:-http://localhost:3001/api/v1}"
GID="${GID:-1}"
TID="${TID:-3}"
LAT="${LAT:-35.0036}"
LNG="${LNG:-135.7752}"
RADIUS="${RADIUS:-1500}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIX="$SCRIPT_DIR/../src/lib/api/__tests__/fixtures"

command -v jq >/dev/null || { echo "jq が必要です (brew install jq / apt install jq)"; exit 1; }

pass=0; drift=0; fail=0

# JSON を「値を無視した正規化キーパス集合」に変換（配列インデックスは [] に畳む）
keypaths() { jq -r 'paths(scalars) | map(if type=="number" then "[]" else tostring end) | join(".")' | sort -u; }

# $1=表示名 $2=HTTPメソッド $3=パス $4=fixtureファイル $5=auth(1なら要JWT)
check() {
  local name="$1" method="$2" path="$3" fixture="$4" need_auth="${5:-0}"

  if [[ "$need_auth" == "1" && -z "${JWT:-}" ]]; then
    printf "  SKIP  %-40s (JWT 未設定)\n" "$name"
    return
  fi

  local hdr=(); [[ -n "${JWT:-}" ]] && hdr=(-H "Authorization: Bearer $JWT")

  local body code
  body="$(curl -sS -m 15 -X "$method" "${hdr[@]}" -w $'\n%{http_code}' "$BASE$path" 2>/dev/null)"
  code="${body##*$'\n'}"
  body="${body%$'\n'*}"

  if [[ "$code" != "200" ]]; then
    printf "  FAIL  %-40s HTTP %s\n" "$name" "$code"
    fail=$((fail+1)); return
  fi
  if ! echo "$body" | jq -e . >/dev/null 2>&1; then
    printf "  FAIL  %-40s 非JSONレスポンス\n" "$name"
    fail=$((fail+1)); return
  fi

  local live exp
  live="$(echo "$body" | keypaths)"
  exp="$(keypaths < "$FIX/$fixture")"

  local missing extra
  missing="$(comm -23 <(echo "$exp") <(echo "$live"))"
  extra="$(comm -13 <(echo "$exp") <(echo "$live"))"

  if [[ -z "$missing" && -z "$extra" ]]; then
    printf "  PASS  %-40s (vs %s)\n" "$name" "$fixture"
    pass=$((pass+1))
  else
    printf "  DRIFT %-40s (vs %s)\n" "$name" "$fixture"
    [[ -n "$missing" ]] && echo "$missing" | sed 's/^/          - MISSING /'
    [[ -n "$extra"   ]] && echo "$extra"   | sed 's/^/          + EXTRA   /'
    drift=$((drift+1))
  fi
}

echo "BASE = $BASE"
echo
echo "[読み取り系]"
check "GET /greenteas"        GET "/greenteas"            greenteas.list.json
check "GET /greenteas/:id"    GET "/greenteas/$GID"       greenteas.show.json
check "GET /temples"          GET "/temples"              temples.list.json
check "GET /temples/:id"      GET "/temples/$TID"         temples.show.json
check "GET /genres"           GET "/genres"               genres.list.json
check "GET /areas"            GET "/areas"                areas.list.json
check "GET /nearby"           GET "/nearby?lat=$LAT&lng=$LNG&radius=$RADIUS" nearby.json

echo
echo "[認証系] (JWT 設定時のみ)"
check "GET /current_user"     GET "/current_user"         current_user.json 1

echo
echo "----------------------------------------"
echo "PASS=$pass  DRIFT=$drift  FAIL=$fail"
echo
echo "注意:"
echo " - DRIFT の MISSING は、配列が空(コメント/いいね0件など)でも出ます。値を確認して誤検知か判断してください。"
echo " - liked_by_current_user / owned_by_current_user は JWT 無しだと出ない場合があります。"
echo " - 書き込み系(likes/comments POST·DELETE, auth/:provider)は副作用があるため自動検証から除外。"
echo "   docs/api-contract-checklist.md の表に沿って手動で確認してください。"

[[ $fail -gt 0 || $drift -gt 0 ]] && exit 1 || exit 0
