// utils/colorUtils.ts (또는 store.ts 파일 상단)
export const getContrastMode = (hexColor: string): 'light' | 'dark' => {
  // Hex 코드가 유효하지 않으면 기본적으로 'dark' 텍스트를 가정합니다.
  if (!hexColor || hexColor.length !== 7 || hexColor[0] !== '#') {
    return 'dark';
  }

  // 1. R, G, B 채널 값 추출
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);

  // 2. 휘도(Luminance) 계산 (BT.709 표준)
  // 값이 클수록 밝음 (0.0 ~ 1.0)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  // 3. 임계값(Threshold) 판단 (0.5를 기준으로 밝기를 나눕니다)
  // 휘도가 0.5보다 높으면 -> 배경이 밝으니 글자는 'dark' (검은색)
  // 휘도가 0.5보다 낮으면 -> 배경이 어두우니 글자는 'light' (흰색)
  return luminance > 0.5 ? 'dark' : 'light';
};
