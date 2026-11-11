export async function loadCards() {
  const response = await fetch('./ironclad_cards_dataset.md');
  if (!response.ok) throw new Error('카드 데이터 파일을 불러오지 못했습니다.');
  return response.json();
}

export const statuses = {
  vulnerable: '취약', weak: '약화', strength: '힘', dexterity: '민첩', frail: '취약함'
};
