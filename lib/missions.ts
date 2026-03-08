export interface Mission {
  id: number
  en: { title: string; text: string }
  zh: { title: string; text: string }
}

export const missions: Mission[] = [
  {
    id: 1,
    en: { title: 'The Grump', text: 'Make your most exaggerated "angry face" and hold it until your next turn.' },
    zh: { title: '愤怒脸', text: '做出你最夸张的"愤怒表情"并保持到你的下一回合。' },
  },
  {
    id: 2,
    en: { title: 'The Statue', text: 'You cannot blink or move your head until you place your next stone.' },
    zh: { title: '雕像', text: '在放下一颗棋子之前，你不能眨眼或移动头部。' },
  },
  {
    id: 3,
    en: { title: 'Mirror Mode', text: 'You must mimic every facial expression your opponent makes for the next three moves.' },
    zh: { title: '镜像模式', text: '接下来三步，你必须模仿对手的每一个面部表情。' },
  },
  {
    id: 4,
    en: { title: 'The Wink', text: 'You must wink at your opponent every time you block their line.' },
    zh: { title: '眨眼', text: '每次你封堵对手的连线时，必须向对手眨眼。' },
  },
  {
    id: 5,
    en: { title: 'Puffy Cheeks', text: 'Play the next two rounds with your cheeks puffed out like a pufferfish.' },
    zh: { title: '鼓腮帮', text: '接下来两回合，像河豚一样鼓起腮帮子下棋。' },
  },
  {
    id: 6,
    en: { title: 'Victory Pose', text: 'Strike a "superhero pose" and hold it for 10 seconds right now.' },
    zh: { title: '胜利姿势', text: '立刻摆出"超级英雄姿势"并保持10秒钟。' },
  },
  {
    id: 7,
    en: { title: 'The Snack Bearer', text: 'You must bring your opponent a snack or drink of their choice after this game.' },
    zh: { title: '零食使者', text: '本局结束后，你必须给对手带一份他/她选择的零食或饮料。' },
  },
  {
    id: 8,
    en: { title: 'The Complimenter', text: 'You must give your opponent three genuine compliments before the game ends.' },
    zh: { title: '夸夸机器', text: '在游戏结束前，你必须真诚地夸对手三次。' },
  },
  {
    id: 9,
    en: { title: 'The Yes-Man', text: 'You must answer "Yes, of course!" to the next three questions your opponent asks.' },
    zh: { title: '应声虫', text: '对手接下来问的三个问题，你必须回答"当然，没问题！"' },
  },
  {
    id: 10,
    en: { title: 'Social Media Debt', text: 'You must let your opponent post one harmless funny photo of you on your social media.' },
    zh: { title: '社交媒体赌注', text: '你必须让对手在你的社交媒体上发一张无害的搞笑照片。' },
  },
  {
    id: 11,
    en: { title: 'The Butler', text: 'For the next 10 minutes, address your opponent as "My Liege" or "Master."' },
    zh: { title: '管家模式', text: '接下来10分钟，称呼对手为"主人"或"大人"。' },
  },
  {
    id: 12,
    en: { title: 'Future Favor', text: 'You owe your opponent one "Get Out of Jail Free" card for a future chore or errand.' },
    zh: { title: '未来欠条', text: '你欠对手一张"免责券"，用于未来某次家务或跑腿。' },
  },
  {
    id: 13,
    en: { title: 'The Poet', text: 'Describe your next move in the form of a rhyming poem.' },
    zh: { title: '吟诗落子', text: '用一首押韵的小诗描述你的下一步棋。' },
  },
  {
    id: 14,
    en: { title: 'Animal Sounds', text: 'Make a different animal sound before every move for the rest of the game.' },
    zh: { title: '动物合唱', text: '本局剩余时间，每次落子前必须发出一种不同的动物叫声。' },
  },
  {
    id: 15,
    en: { title: 'The Truth Bomb', text: 'Your opponent gets to ask you one "Truth or Dare" style question, and you must answer honestly.' },
    zh: { title: '真心话', text: '对手可以向你提一个"真心话大冒险"式的问题，你必须诚实作答。' },
  },
  {
    id: 16,
    en: { title: 'Accents', text: 'Speak in a foreign accent (British, French, or Cowboy) for the next five minutes.' },
    zh: { title: '外国腔', text: '接下来五分钟，用外国口音说话（英式、法式或牛仔风）。' },
  },
  {
    id: 17,
    en: { title: 'The Hype Man', text: 'Every time your opponent places a stone, cheer and say "What a brilliant move!"' },
    zh: { title: '啦啦队长', text: '每次对手落子，你都要欢呼并说"妙啊，神来之笔！"' },
  },
  {
    id: 18,
    en: { title: 'Singing Narrator', text: 'Sing your inner thoughts about the current board state for one full minute.' },
    zh: { title: '歌唱解说', text: '把你对当前棋局的想法唱出来，持续整整一分钟。' },
  },
  {
    id: 19,
    en: { title: 'Slow Motion', text: 'Perform your next three moves in extreme slow motion.' },
    zh: { title: '慢动作', text: '接下来三步棋以极慢动作完成。' },
  },
  {
    id: 20,
    en: { title: 'The Echo', text: 'Repeat the last three words of everything your opponent says for the next two rounds.' },
    zh: { title: '回声', text: '接下来两回合，重复对手说的每句话的最后三个字。' },
  },
]

export function getMission(id: number): Mission | undefined {
  return missions.find((m) => m.id === id)
}
