import basicsExtra from './words/basics';
import natureExtra from './words/nature';
import travelExtra from './words/travel';
import businessExtra from './words/business';
import academicExtra from './words/academic';
import { JA_DECKS } from './jaDecks';

export type WordEntry = {
  word: string;
  pos: string; // part of speech
  vi: string; // Vietnamese meaning
  meaning: string; // English definition
  jp?: string; // Japanese display (kanji / kana)
  kana?: string; // Japanese reading — typed as romaji
};

export type Lang = 'en' | 'ja';

export type Deck = {
  id: string;
  lang?: Lang;
  name: string;
  nameVi: string;
  icon: string;
  level: string;
  description: string;
  speed: number; // difficulty multiplier
  color: string; // tailwind gradient classes
  words: WordEntry[];
};

const w = (list: [string, string, string, string][]): WordEntry[] =>
  list.map(([word, pos, vi, meaning]) => ({ word, pos, vi, meaning }));

export const DECKS: Deck[] = [
  {
    id: 'basics',
    name: 'Everyday Basics',
    nameVi: 'Từ vựng hằng ngày',
    icon: '🌱',
    level: 'Beginner',
    description: 'Short, common words you use every day.',
    speed: 0.9,
    color: 'from-emerald-400 to-teal-500',
    words: w([
      ['cat', 'n', 'con mèo', 'a small furry pet animal'],
      ['dog', 'n', 'con chó', 'a loyal pet that barks'],
      ['sun', 'n', 'mặt trời', 'the star that gives us daylight'],
      ['red', 'adj', 'màu đỏ', 'the color of blood or fire'],
      ['cup', 'n', 'cái cốc', 'a small container for drinks'],
      ['book', 'n', 'quyển sách', 'pages of writing bound together'],
      ['home', 'n', 'nhà, tổ ấm', 'the place where you live'],
      ['milk', 'n', 'sữa', 'white drink from cows'],
      ['rain', 'n', 'mưa', 'water falling from clouds'],
      ['tree', 'n', 'cái cây', 'a tall plant with a trunk'],
      ['door', 'n', 'cánh cửa', 'you open it to enter a room'],
      ['fish', 'n', 'con cá', 'an animal that lives in water'],
      ['bread', 'n', 'bánh mì', 'baked food made from flour'],
      ['chair', 'n', 'cái ghế', 'a seat with a back'],
      ['water', 'n', 'nước', 'clear liquid we drink'],
      ['apple', 'n', 'quả táo', 'a round red or green fruit'],
      ['happy', 'adj', 'vui vẻ, hạnh phúc', 'feeling pleased and joyful'],
      ['smile', 'v', 'mỉm cười', 'to make a happy facial expression'],
      ['green', 'adj', 'màu xanh lá', 'the color of grass'],
      ['music', 'n', 'âm nhạc', 'pleasant organized sounds'],
      ['house', 'n', 'ngôi nhà', 'a building people live in'],
      ['table', 'n', 'cái bàn', 'furniture with a flat top'],
      ['friend', 'n', 'người bạn', 'a person you like and trust'],
      ['window', 'n', 'cửa sổ', 'glass opening in a wall'],
      ['family', 'n', 'gia đình', 'parents, children and relatives'],
      ['garden', 'n', 'khu vườn', 'land where plants are grown'],
      ['school', 'n', 'trường học', 'a place where children learn'],
      ['summer', 'n', 'mùa hè', 'the hottest season of the year'],
      ['orange', 'n', 'quả cam', 'a citrus fruit; also a color'],
      ['pencil', 'n', 'bút chì', 'a tool for writing or drawing'],
      ['morning', 'n', 'buổi sáng', 'the early part of the day'],
      ['kitchen', 'n', 'nhà bếp', 'the room where food is cooked'],
      ['holiday', 'n', 'kỳ nghỉ, ngày lễ', 'a day off for rest or fun'],
      ['weather', 'n', 'thời tiết', 'conditions like rain or sun'],
      ['birthday', 'n', 'sinh nhật', 'the day you were born'],
      ['sandwich', 'n', 'bánh mì kẹp', 'filling between two slices of bread'],
    ]),
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    nameVi: 'Động vật & Thiên nhiên',
    icon: '🦜',
    level: 'Elementary',
    description: 'Creatures, landscapes and the wild world.',
    speed: 0.95,
    color: 'from-lime-400 to-green-600',
    words: w([
      ['owl', 'n', 'con cú', 'a night bird with big eyes'],
      ['bee', 'n', 'con ong', 'an insect that makes honey'],
      ['fox', 'n', 'con cáo', 'a clever wild animal with a bushy tail'],
      ['frog', 'n', 'con ếch', 'a jumping green amphibian'],
      ['wolf', 'n', 'con sói', 'a wild animal like a large dog'],
      ['deer', 'n', 'con hươu', 'a forest animal with antlers'],
      ['lake', 'n', 'hồ nước', 'a large body of still water'],
      ['leaf', 'n', 'chiếc lá', 'the flat green part of a plant'],
      ['moss', 'n', 'rêu', 'a soft green plant on rocks'],
      ['eagle', 'n', 'đại bàng', 'a large powerful bird of prey'],
      ['tiger', 'n', 'con hổ', 'a big striped wild cat'],
      ['river', 'n', 'dòng sông', 'a natural flowing stream of water'],
      ['cloud', 'n', 'đám mây', 'white mass of water vapor in the sky'],
      ['ocean', 'n', 'đại dương', 'a huge area of salt water'],
      ['storm', 'n', 'cơn bão', 'violent weather with wind and rain'],
      ['parrot', 'n', 'con vẹt', 'a colorful bird that can talk'],
      ['rabbit', 'n', 'con thỏ', 'a small animal with long ears'],
      ['forest', 'n', 'khu rừng', 'a large area full of trees'],
      ['desert', 'n', 'sa mạc', 'a dry, sandy region'],
      ['island', 'n', 'hòn đảo', 'land surrounded by water'],
      ['turtle', 'n', 'con rùa', 'a reptile with a hard shell'],
      ['monkey', 'n', 'con khỉ', 'a playful primate that climbs'],
      ['valley', 'n', 'thung lũng', 'low land between hills'],
      ['dolphin', 'n', 'cá heo', 'a smart sea mammal'],
      ['penguin', 'n', 'chim cánh cụt', 'a black-and-white bird that swims'],
      ['volcano', 'n', 'núi lửa', 'a mountain that erupts lava'],
      ['giraffe', 'n', 'hươu cao cổ', 'the tallest animal, long neck'],
      ['glacier', 'n', 'sông băng', 'a slow-moving mass of ice'],
      ['thunder', 'n', 'tiếng sấm', 'loud sound after lightning'],
      ['elephant', 'n', 'con voi', 'the largest land animal'],
      ['mountain', 'n', 'ngọn núi', 'a very high hill'],
      ['kangaroo', 'n', 'chuột túi', 'an Australian animal that hops'],
      ['butterfly', 'n', 'con bướm', 'an insect with colorful wings'],
      ['waterfall', 'n', 'thác nước', 'water falling from a height'],
      ['crocodile', 'n', 'cá sấu', 'a large reptile with strong jaws'],
      ['rainforest', 'n', 'rừng mưa nhiệt đới', 'a dense, wet tropical forest'],
    ]),
  },
  {
    id: 'travel',
    name: 'Travel & Food',
    nameVi: 'Du lịch & Ẩm thực',
    icon: '✈️',
    level: 'Intermediate',
    description: 'Words for trips, hotels, and tasty meals.',
    speed: 1.0,
    color: 'from-sky-400 to-indigo-500',
    words: w([
      ['map', 'n', 'bản đồ', 'a drawing that shows places'],
      ['bus', 'n', 'xe buýt', 'a large vehicle for passengers'],
      ['tea', 'n', 'trà', 'a hot drink made from leaves'],
      ['taxi', 'n', 'xe taxi', 'a car you pay to ride in'],
      ['menu', 'n', 'thực đơn', 'a list of dishes in a restaurant'],
      ['soup', 'n', 'món súp, canh', 'a liquid food served hot'],
      ['rice', 'n', 'cơm, gạo', 'small grains eaten as food'],
      ['cafe', 'n', 'quán cà phê', 'a small place selling coffee'],
      ['hotel', 'n', 'khách sạn', 'a place where travelers stay'],
      ['beach', 'n', 'bãi biển', 'sandy shore by the sea'],
      ['train', 'n', 'tàu hỏa', 'a vehicle running on rails'],
      ['guide', 'n', 'hướng dẫn viên', 'a person who shows the way'],
      ['pasta', 'n', 'mì Ý', 'Italian food made from dough'],
      ['salad', 'n', 'rau trộn, xa lát', 'a dish of mixed raw vegetables'],
      ['ticket', 'n', 'vé', 'a paper that allows entry or travel'],
      ['flight', 'n', 'chuyến bay', 'a journey by plane'],
      ['museum', 'n', 'bảo tàng', 'a building showing art or history'],
      ['noodle', 'n', 'sợi mì', 'a long thin strip of dough'],
      ['dessert', 'n', 'món tráng miệng', 'sweet food after a meal'],
      ['luggage', 'n', 'hành lý', 'bags and suitcases for travel'],
      ['airport', 'n', 'sân bay', 'a place where planes land'],
      ['journey', 'n', 'hành trình', 'traveling from one place to another'],
      ['tourist', 'n', 'khách du lịch', 'a person visiting for pleasure'],
      ['cuisine', 'n', 'ẩm thực', 'a style of cooking'],
      ['passport', 'n', 'hộ chiếu', 'an official travel document'],
      ['souvenir', 'n', 'quà lưu niệm', 'an item kept as a memory of a trip'],
      ['vacation', 'n', 'kỳ nghỉ', 'time spent away for rest'],
      ['itinerary', 'n', 'lịch trình', 'a planned route of a journey'],
      ['breakfast', 'n', 'bữa sáng', 'the first meal of the day'],
      ['delicious', 'adj', 'ngon miệng', 'tasting very good'],
      ['adventure', 'n', 'cuộc phiêu lưu', 'an exciting experience'],
      ['restaurant', 'n', 'nhà hàng', 'a place where meals are served'],
      ['vegetarian', 'n', 'người ăn chay', 'a person who does not eat meat'],
      ['sightseeing', 'n', 'tham quan', 'visiting interesting places'],
      ['reservation', 'n', 'sự đặt chỗ', 'a booking made in advance'],
      ['destination', 'n', 'điểm đến', 'the place you are going to'],
    ]),
  },
  {
    id: 'business',
    name: 'Business English',
    nameVi: 'Tiếng Anh thương mại',
    icon: '💼',
    level: 'Upper-Intermediate',
    description: 'Office, finance and workplace vocabulary.',
    speed: 1.05,
    color: 'from-amber-400 to-orange-600',
    words: w([
      ['deal', 'n', 'thỏa thuận, giao dịch', 'an agreement between parties'],
      ['goal', 'n', 'mục tiêu', 'something you aim to achieve'],
      ['team', 'n', 'đội, nhóm', 'a group working together'],
      ['loan', 'n', 'khoản vay', 'money borrowed to be repaid'],
      ['asset', 'n', 'tài sản', 'something valuable that is owned'],
      ['brand', 'n', 'thương hiệu', 'a name identifying a product'],
      ['client', 'n', 'khách hàng', 'a customer of a professional'],
      ['budget', 'n', 'ngân sách', 'a plan for spending money'],
      ['profit', 'n', 'lợi nhuận', 'money gained after costs'],
      ['market', 'n', 'thị trường', 'where goods are bought and sold'],
      ['salary', 'n', 'tiền lương', 'fixed regular pay for work'],
      ['invest', 'v', 'đầu tư', 'put money in to earn more'],
      ['meeting', 'n', 'cuộc họp', 'a gathering to discuss things'],
      ['revenue', 'n', 'doanh thu', 'income a company receives'],
      ['startup', 'n', 'công ty khởi nghiệp', 'a newly founded company'],
      ['deadline', 'n', 'hạn chót', 'the latest time to finish'],
      ['contract', 'n', 'hợp đồng', 'a legal written agreement'],
      ['strategy', 'n', 'chiến lược', 'a plan to reach a goal'],
      ['employee', 'n', 'nhân viên', 'a person paid to work for others'],
      ['manager', 'n', 'người quản lý', 'a person in charge of staff'],
      ['proposal', 'n', 'bản đề xuất', 'a plan put forward for consideration'],
      ['marketing', 'n', 'tiếp thị', 'promoting and selling products'],
      ['negotiate', 'v', 'đàm phán', 'discuss to reach an agreement'],
      ['executive', 'n', 'giám đốc điều hành', 'a senior manager'],
      ['colleague', 'n', 'đồng nghiệp', 'a person you work with'],
      ['financial', 'adj', 'thuộc về tài chính', 'relating to money'],
      ['logistics', 'n', 'hậu cần', 'organizing transport and supply'],
      ['investment', 'n', 'khoản đầu tư', 'money put in for future profit'],
      ['commission', 'n', 'tiền hoa hồng', 'payment based on sales'],
      ['enterprise', 'n', 'doanh nghiệp', 'a business or company'],
      ['conference', 'n', 'hội nghị', 'a large formal meeting'],
      ['stakeholder', 'n', 'bên liên quan', 'a person with interest in a business'],
      ['partnership', 'n', 'quan hệ đối tác', 'working together as partners'],
      ['productivity', 'n', 'năng suất', 'the rate of producing results'],
      ['entrepreneur', 'n', 'doanh nhân', 'a person who starts businesses'],
      ['consultation', 'n', 'sự tư vấn', 'a meeting to get expert advice'],
    ]),
  },
  {
    id: 'academic',
    name: 'Academic / IELTS',
    nameVi: 'Học thuật / IELTS',
    icon: '🎓',
    level: 'Advanced',
    description: 'Long, complex words for exams and essays.',
    speed: 1.1,
    color: 'from-fuchsia-500 to-purple-700',
    words: w([
      ['data', 'n', 'dữ liệu', 'facts and statistics collected'],
      ['valid', 'adj', 'hợp lệ, có căn cứ', 'logically sound or acceptable'],
      ['trend', 'n', 'xu hướng', 'a general direction of change'],
      ['theory', 'n', 'lý thuyết', 'an idea that explains something'],
      ['method', 'n', 'phương pháp', 'a way of doing something'],
      ['impact', 'n', 'tác động', 'a strong effect or influence'],
      ['factor', 'n', 'yếu tố', 'something that affects a result'],
      ['crucial', 'adj', 'cốt yếu, then chốt', 'extremely important'],
      ['analyze', 'v', 'phân tích', 'examine something in detail'],
      ['concept', 'n', 'khái niệm', 'an abstract idea'],
      ['context', 'n', 'bối cảnh, ngữ cảnh', 'the circumstances around something'],
      ['diverse', 'adj', 'đa dạng', 'showing great variety'],
      ['evident', 'adj', 'hiển nhiên, rõ ràng', 'clearly seen or understood'],
      ['research', 'n', 'nghiên cứu', 'careful study to find facts'],
      ['evaluate', 'v', 'đánh giá', 'judge the value of something'],
      ['coherent', 'adj', 'mạch lạc', 'logical and consistent'],
      ['paradigm', 'n', 'mô hình, hệ hình', 'a typical model or pattern'],
      ['empirical', 'adj', 'thực nghiệm', 'based on observation or experiment'],
      ['ambiguous', 'adj', 'mơ hồ, nước đôi', 'having more than one meaning'],
      ['inevitable', 'adj', 'không thể tránh khỏi', 'certain to happen'],
      ['sufficient', 'adj', 'đủ, đầy đủ', 'enough for a purpose'],
      ['phenomenon', 'n', 'hiện tượng', 'an observable fact or event'],
      ['hypothesis', 'n', 'giả thuyết', 'a proposed explanation to test'],
      ['significant', 'adj', 'đáng kể, quan trọng', 'important or large enough to notice'],
      ['consequence', 'n', 'hậu quả', 'a result of an action'],
      ['fundamental', 'adj', 'cơ bản, nền tảng', 'basic and essential'],
      ['perspective', 'n', 'góc nhìn, quan điểm', 'a particular point of view'],
      ['controversy', 'n', 'sự tranh cãi', 'public disagreement'],
      ['sustainable', 'adj', 'bền vững', 'able to continue long-term'],
      ['substantial', 'adj', 'đáng kể, lớn lao', 'large in amount or importance'],
      ['deteriorate', 'v', 'xấu đi, suy giảm', 'become progressively worse'],
      ['methodology', 'n', 'phương pháp luận', 'a system of methods used'],
      ['comprehensive', 'adj', 'toàn diện', 'complete and including everything'],
      ['unprecedented', 'adj', 'chưa từng có', 'never done or known before'],
      ['infrastructure', 'n', 'cơ sở hạ tầng', 'basic systems like roads and power'],
      ['interpretation', 'n', 'sự diễn giải', 'an explanation of meaning'],
    ]),
  },
];

// ---- Merge the big word lists into each deck (deduplicated, letters only) ----
const EXTRA: Record<string, string> = {
  basics: basicsExtra,
  nature: natureExtra,
  travel: travelExtra,
  business: businessExtra,
  academic: academicExtra,
};

function parseList(src: string): WordEntry[] {
  return src
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [word, pos, vi] = l.split('|');
      return { word: (word || '').trim().toLowerCase(), pos: (pos || 'n').trim(), vi: (vi || '').trim(), meaning: '' };
    })
    .filter((e) => /^[a-z]+$/.test(e.word) && e.vi);
}

for (const deck of DECKS) {
  const seen = new Set<string>();
  deck.words = [...deck.words, ...parseList(EXTRA[deck.id] ?? '')].filter((e) => {
    if (seen.has(e.word)) return false;
    seen.add(e.word);
    return true;
  });
}

DECKS.push(...JA_DECKS);

export const deckLang = (d: Deck): Lang => d.lang ?? 'en';
/** Text shown for a word: Japanese display or the English word */
export const displayOf = (e: WordEntry) => e.jp ?? e.word;

export const STAGE_COUNT = 5;
/** Words per stage: 12, 16, 20, 24, 28 */
export const stageWordCount = (index: number) => 12 + index * 4;
export const STAGE_NAMES = ['Drizzle', 'Shower', 'Downpour', 'Thunderstorm', 'Monsoon'];

export type StageConfig = {
  index: number;
  name: string;
  queue: WordEntry[];
  fallTime: number; // seconds for a word to fall the full height
  spawnInterval: number; // seconds between spawns
  maxActive: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a game's word plan: a random selection with NO repeated word anywhere in the game.
 * Short words go in early stages and longer ones later, so difficulty still rises.
 */
export function createGamePlan(deck: Deck, startStage: number): WordEntry[][] {
  const stages = Array.from({ length: STAGE_COUNT }, (_, i) => i).filter((i) => i >= startStage);
  const total = stages.reduce((s, i) => s + stageWordCount(i), 0);
  const picked = shuffle(deck.words).slice(0, Math.min(total, deck.words.length));
  // sort by length with a little jitter so stages mix nearby lengths
  picked.sort((a, b) => a.word.length + Math.random() * 2 - (b.word.length + Math.random() * 2));

  const plan: WordEntry[][] = Array.from({ length: STAGE_COUNT }, () => []);
  let cursor = 0;
  for (const i of stages) {
    const n = Math.round((stageWordCount(i) / total) * picked.length);
    plan[i] = shuffle(picked.slice(cursor, i === stages[stages.length - 1] ? undefined : cursor + n));
    cursor += n;
  }
  return plan;
}

export function buildStage(deck: Deck, index: number, plan: WordEntry[][]): StageConfig {
  const queue = plan[index] ?? [];
  return {
    index,
    name: STAGE_NAMES[index],
    queue,
    fallTime: (13 - index * 1.6) / deck.speed,
    spawnInterval: (2.6 - index * 0.35) / deck.speed,
    maxActive: 3 + index,
  };
}

export function getBest(deckId: string): number {
  try {
    return Number(localStorage.getItem(`parroto-best-${deckId}`) || 0);
  } catch {
    return 0;
  }
}

export function setBest(deckId: string, score: number) {
  try {
    if (score > getBest(deckId)) localStorage.setItem(`parroto-best-${deckId}`, String(score));
  } catch {
    /* ignore */
  }
}
