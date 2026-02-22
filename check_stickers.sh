emojis=(
"1f525" "2764_fe0f" "1f602" "1f60d" "1f60e" "1f914" "1f97a" "1f973" "1f92f" "1f921" "1f47b" "1f47d" "1f480" "1f440" "1f44d" "1f44e" "1f44f" "1f389" "2728" "1f4a9"
)
for e in "${emojis[@]}"; do
  url="https://fonts.gstatic.com/s/e/notoemoji/latest/$e/512.webp"
  status=$(curl -o /dev/null -s -w "%{http_code}\n" "$url")
  echo "$e: $status"
done
