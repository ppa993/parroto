import type { Deck, WordEntry } from './decks';
import { toRomaji } from '../lib/kana';

// jp|kana|pos|vietnamese
const N5_BASICS = `
水|みず|n|nước
火|ひ|n|lửa
山|やま|n|núi
川|かわ|n|sông
木|き|n|cây
花|はな|n|hoa
空|そら|n|bầu trời
雨|あめ|n|mưa
雪|ゆき|n|tuyết
海|うみ|n|biển
人|ひと|n|người
男|おとこ|n|đàn ông
女|おんな|n|phụ nữ
子供|こども|n|trẻ em
友達|ともだち|n|bạn bè
先生|せんせい|n|giáo viên
学生|がくせい|n|học sinh
家族|かぞく|n|gia đình
母|はは|n|mẹ
父|ちち|n|bố
兄|あに|n|anh trai
姉|あね|n|chị gái
弟|おとうと|n|em trai
妹|いもうと|n|em gái
犬|いぬ|n|con chó
猫|ねこ|n|con mèo
鳥|とり|n|con chim
魚|さかな|n|con cá
本|ほん|n|quyển sách
車|くるま|n|ô tô
家|いえ|n|ngôi nhà
学校|がっこう|n|trường học
会社|かいしゃ|n|công ty
病院|びょういん|n|bệnh viện
駅|えき|n|nhà ga
店|みせ|n|cửa hàng
部屋|へや|n|căn phòng
机|つくえ|n|cái bàn
椅子|いす|n|cái ghế
窓|まど|n|cửa sổ
時計|とけい|n|đồng hồ
電話|でんわ|n|điện thoại
写真|しゃしん|n|bức ảnh
お金|おかね|n|tiền
名前|なまえ|n|tên
言葉|ことば|n|từ ngữ
日本|にほん|n|Nhật Bản
日本語|にほんご|n|tiếng Nhật
英語|えいご|n|tiếng Anh
今日|きょう|n|hôm nay
明日|あした|n|ngày mai
昨日|きのう|n|hôm qua
朝|あさ|n|buổi sáng
昼|ひる|n|buổi trưa
夜|よる|n|buổi tối
時間|じかん|n|thời gian
毎日|まいにち|n|mỗi ngày
天気|てんき|n|thời tiết
春|はる|n|mùa xuân
夏|なつ|n|mùa hè
秋|あき|n|mùa thu
冬|ふゆ|n|mùa đông
一|いち|n|số một
二|に|n|số hai
三|さん|n|số ba
四|よん|n|số bốn
五|ご|n|số năm
十|じゅう|n|số mười
百|ひゃく|n|một trăm
千|せん|n|một nghìn
大きい|おおきい|adj|to, lớn
小さい|ちいさい|adj|nhỏ
新しい|あたらしい|adj|mới
古い|ふるい|adj|cũ
高い|たかい|adj|cao, đắt
安い|やすい|adj|rẻ
暑い|あつい|adj|nóng
寒い|さむい|adj|lạnh
楽しい|たのしい|adj|vui vẻ
難しい|むずかしい|adj|khó
易しい|やさしい|adj|dễ
美味しい|おいしい|adj|ngon
早い|はやい|adj|sớm, nhanh
長い|ながい|adj|dài
白い|しろい|adj|màu trắng
黒い|くろい|adj|màu đen
赤い|あかい|adj|màu đỏ
青い|あおい|adj|màu xanh
元気|げんき|adj|khỏe mạnh
静か|しずか|adj|yên tĩnh
有名|ゆうめい|adj|nổi tiếng
好き|すき|adj|thích
嫌い|きらい|adj|ghét
綺麗|きれい|adj|đẹp, sạch
食べる|たべる|v|ăn
飲む|のむ|v|uống
見る|みる|v|xem, nhìn
聞く|きく|v|nghe, hỏi
話す|はなす|v|nói chuyện
読む|よむ|v|đọc
書く|かく|v|viết
行く|いく|v|đi
来る|くる|v|đến
帰る|かえる|v|về
寝る|ねる|v|ngủ
起きる|おきる|v|thức dậy
買う|かう|v|mua
待つ|まつ|v|chờ đợi
遊ぶ|あそぶ|v|chơi
勉強|べんきょう|n|việc học
仕事|しごと|n|công việc
こんにちは|こんにちは|phr|xin chào
ありがとう|ありがとう|phr|cảm ơn
さようなら|さようなら|phr|tạm biệt
すみません|すみません|phr|xin lỗi
おはよう|おはよう|phr|chào buổi sáng
`;

const FOOD_TRAVEL = `
ご飯|ごはん|n|cơm, bữa ăn
朝ご飯|あさごはん|n|bữa sáng
晩ご飯|ばんごはん|n|bữa tối
お茶|おちゃ|n|trà
お酒|おさけ|n|rượu
牛乳|ぎゅうにゅう|n|sữa bò
卵|たまご|n|trứng
肉|にく|n|thịt
野菜|やさい|n|rau
果物|くだもの|n|trái cây
パン|ぱん|n|bánh mì
寿司|すし|n|sushi
刺身|さしみ|n|gỏi cá sống
天ぷら|てんぷら|n|tempura
ラーメン|らーめん|n|mì ramen
うどん|うどん|n|mì udon
そば|そば|n|mì soba
味噌汁|みそしる|n|canh miso
弁当|べんとう|n|cơm hộp
お菓子|おかし|n|bánh kẹo
砂糖|さとう|n|đường
塩|しお|n|muối
醤油|しょうゆ|n|nước tương
箸|はし|n|đũa
皿|さら|n|cái đĩa
コーヒー|こーひー|n|cà phê
ジュース|じゅーす|n|nước ép
ビール|びーる|n|bia
ケーキ|けーき|n|bánh ngọt
アイス|あいす|n|kem
りんご|りんご|n|quả táo
みかん|みかん|n|quả quýt
バナナ|ばなな|n|quả chuối
いちご|いちご|n|dâu tây
鶏肉|とりにく|n|thịt gà
豚肉|ぶたにく|n|thịt lợn
牛肉|ぎゅうにく|n|thịt bò
甘い|あまい|adj|ngọt
辛い|からい|adj|cay
しょっぱい|しょっぱい|adj|mặn
苦い|にがい|adj|đắng
料理|りょうり|n|món ăn, nấu ăn
食堂|しょくどう|n|nhà ăn
喫茶店|きっさてん|n|quán cà phê
レストラン|れすとらん|n|nhà hàng
メニュー|めにゅー|n|thực đơn
注文|ちゅうもん|n|gọi món
会計|かいけい|n|thanh toán
旅行|りょこう|n|du lịch
旅館|りょかん|n|nhà trọ kiểu Nhật
ホテル|ほてる|n|khách sạn
空港|くうこう|n|sân bay
飛行機|ひこうき|n|máy bay
電車|でんしゃ|n|tàu điện
新幹線|しんかんせん|n|tàu cao tốc
地下鉄|ちかてつ|n|tàu điện ngầm
バス|ばす|n|xe buýt
タクシー|たくしー|n|taxi
自転車|じてんしゃ|n|xe đạp
切符|きっぷ|n|vé
荷物|にもつ|n|hành lý
地図|ちず|n|bản đồ
道|みち|n|con đường
右|みぎ|n|bên phải
左|ひだり|n|bên trái
北|きた|n|phía bắc
南|みなみ|n|phía nam
東|ひがし|n|phía đông
西|にし|n|phía tây
近い|ちかい|adj|gần
遠い|とおい|adj|xa
入口|いりぐち|n|lối vào
出口|でぐち|n|lối ra
お土産|おみやげ|n|quà lưu niệm
温泉|おんせん|n|suối nước nóng
神社|じんじゃ|n|đền thần đạo
お寺|おてら|n|chùa
お城|おしろ|n|lâu đài
公園|こうえん|n|công viên
美術館|びじゅつかん|n|bảo tàng mỹ thuật
博物館|はくぶつかん|n|viện bảo tàng
図書館|としょかん|n|thư viện
銀行|ぎんこう|n|ngân hàng
郵便局|ゆうびんきょく|n|bưu điện
コンビニ|こんびに|n|cửa hàng tiện lợi
予約|よやく|n|đặt chỗ
部屋代|へやだい|n|tiền phòng
観光|かんこう|n|tham quan
写真家|しゃしんか|n|nhiếp ảnh gia
景色|けしき|n|phong cảnh
外国|がいこく|n|nước ngoài
外国人|がいこくじん|n|người nước ngoài
国|くに|n|đất nước
町|まち|n|thị trấn
村|むら|n|làng
橋|はし|n|cây cầu
島|しま|n|hòn đảo
富士山|ふじさん|n|núi Phú Sĩ
東京|とうきょう|n|Tokyo
京都|きょうと|n|Kyoto
大阪|おおさか|n|Osaka
パスポート|ぱすぽーと|n|hộ chiếu
カメラ|かめら|n|máy ảnh
スーツケース|すーつけーす|n|va li
乗る|のる|v|lên xe
降りる|おりる|v|xuống xe
着く|つく|v|đến nơi
泊まる|とまる|v|trọ lại
払う|はらう|v|trả tiền
曲がる|まがる|v|rẽ
渡る|わたる|v|băng qua
`;

const VERBS_ADJ = `
会う|あう|v|gặp
開ける|あける|v|mở
閉める|しめる|v|đóng
上げる|あげる|v|nâng lên, cho
洗う|あらう|v|rửa
歩く|あるく|v|đi bộ
言う|いう|v|nói
入れる|いれる|v|cho vào
歌う|うたう|v|hát
生まれる|うまれる|v|được sinh ra
売る|うる|v|bán
置く|おく|v|đặt
送る|おくる|v|gửi
教える|おしえる|v|dạy
押す|おす|v|ấn, đẩy
覚える|おぼえる|v|nhớ
泳ぐ|およぐ|v|bơi
終わる|おわる|v|kết thúc
始まる|はじまる|v|bắt đầu
返す|かえす|v|trả lại
借りる|かりる|v|mượn
貸す|かす|v|cho mượn
考える|かんがえる|v|suy nghĩ
切る|きる|v|cắt
着る|きる|v|mặc
消す|けす|v|tắt, xóa
答える|こたえる|v|trả lời
困る|こまる|v|gặp khó khăn
咲く|さく|v|nở
死ぬ|しぬ|v|chết
知る|しる|v|biết
住む|すむ|v|sống, ở
座る|すわる|v|ngồi
立つ|たつ|v|đứng
頼む|たのむ|v|nhờ vả
使う|つかう|v|sử dụng
疲れる|つかれる|v|mệt
作る|つくる|v|làm, chế tạo
出る|でる|v|ra ngoài
出かける|でかける|v|đi ra ngoài
手伝う|てつだう|v|giúp đỡ
止まる|とまる|v|dừng lại
取る|とる|v|lấy
撮る|とる|v|chụp ảnh
習う|ならう|v|học
並ぶ|ならぶ|v|xếp hàng
なる|なる|v|trở thành
脱ぐ|ぬぐ|v|cởi
登る|のぼる|v|leo
入る|はいる|v|vào
走る|はしる|v|chạy
働く|はたらく|v|làm việc
引く|ひく|v|kéo
弾く|ひく|v|chơi nhạc cụ
吹く|ふく|v|thổi
降る|ふる|v|rơi (mưa)
曲げる|まげる|v|uốn cong
磨く|みがく|v|đánh bóng
見せる|みせる|v|cho xem
持つ|もつ|v|cầm, mang
休む|やすむ|v|nghỉ ngơi
呼ぶ|よぶ|v|gọi
分かる|わかる|v|hiểu
忘れる|わすれる|v|quên
笑う|わらう|v|cười
泣く|なく|v|khóc
思う|おもう|v|nghĩ
感じる|かんじる|v|cảm thấy
決める|きめる|v|quyết định
調べる|しらべる|v|tìm hiểu
探す|さがす|v|tìm kiếm
見つける|みつける|v|tìm thấy
続ける|つづける|v|tiếp tục
変える|かえる|v|thay đổi
練習|れんしゅう|n|luyện tập
運動|うんどう|n|vận động
散歩|さんぽ|n|đi dạo
掃除|そうじ|n|dọn dẹp
洗濯|せんたく|n|giặt giũ
結婚|けっこん|n|kết hôn
電気|でんき|n|điện, đèn
暖かい|あたたかい|adj|ấm áp
涼しい|すずしい|adj|mát mẻ
明るい|あかるい|adj|sáng sủa
暗い|くらい|adj|tối
重い|おもい|adj|nặng
軽い|かるい|adj|nhẹ
強い|つよい|adj|mạnh
弱い|よわい|adj|yếu
広い|ひろい|adj|rộng
狭い|せまい|adj|chật hẹp
多い|おおい|adj|nhiều
少ない|すくない|adj|ít
忙しい|いそがしい|adj|bận rộn
面白い|おもしろい|adj|thú vị
つまらない|つまらない|adj|nhàm chán
優しい|やさしい|adj|hiền lành
厳しい|きびしい|adj|nghiêm khắc
嬉しい|うれしい|adj|vui mừng
悲しい|かなしい|adj|buồn
寂しい|さびしい|adj|cô đơn
痛い|いたい|adj|đau
危ない|あぶない|adj|nguy hiểm
若い|わかい|adj|trẻ
可愛い|かわいい|adj|dễ thương
汚い|きたない|adj|bẩn
便利|べんり|adj|tiện lợi
大切|たいせつ|adj|quan trọng
簡単|かんたん|adj|đơn giản
大丈夫|だいじょうぶ|adj|không sao
上手|じょうず|adj|giỏi
下手|へた|adj|kém
丁寧|ていねい|adj|lịch sự
親切|しんせつ|adj|tử tế
暇|ひま|adj|rảnh rỗi
残念|ざんねん|adj|đáng tiếc
`;

const KATAKANA = `
テレビ|てれび|n|tivi
ラジオ|らじお|n|radio
パソコン|ぱそこん|n|máy tính
スマホ|すまほ|n|điện thoại thông minh
メール|めーる|n|email
インターネット|いんたーねっと|n|internet
ゲーム|げーむ|n|trò chơi
アニメ|あにめ|n|phim hoạt hình
マンガ|まんが|n|truyện tranh
ドラマ|どらま|n|phim truyền hình
ニュース|にゅーす|n|tin tức
スポーツ|すぽーつ|n|thể thao
サッカー|さっかー|n|bóng đá
テニス|てにす|n|quần vợt
ゴルフ|ごるふ|n|gôn
プール|ぷーる|n|hồ bơi
ピアノ|ぴあの|n|đàn piano
ギター|ぎたー|n|đàn ghi-ta
ダンス|だんす|n|nhảy múa
パーティー|ぱーてぃー|n|bữa tiệc
プレゼント|ぷれぜんと|n|quà tặng
クラス|くらす|n|lớp học
テスト|てすと|n|bài kiểm tra
ノート|のーと|n|vở ghi
ペン|ぺん|n|bút
ボールペン|ぼーるぺん|n|bút bi
シャツ|しゃつ|n|áo sơ mi
ズボン|ずぼん|n|quần dài
スカート|すかーと|n|chân váy
コート|こーと|n|áo khoác
ネクタイ|ねくたい|n|cà vạt
セーター|せーたー|n|áo len
ドア|どあ|n|cửa
ベッド|べっど|n|giường
トイレ|といれ|n|nhà vệ sinh
シャワー|しゃわー|n|vòi sen
キッチン|きっちん|n|nhà bếp
エレベーター|えれべーたー|n|thang máy
エアコン|えあこん|n|điều hòa
カレー|かれー|n|cà ri
サラダ|さらだ|n|rau trộn
スープ|すーぷ|n|súp
ピザ|ぴざ|n|pizza
ハンバーガー|はんばーがー|n|bánh hamburger
チョコレート|ちょこれーと|n|sô cô la
ミルク|みるく|n|sữa
ワイン|わいん|n|rượu vang
トマト|とまと|n|cà chua
レモン|れもん|n|quả chanh
オレンジ|おれんじ|n|quả cam
メロン|めろん|n|dưa lưới
デパート|でぱーと|n|cửa hàng bách hóa
スーパー|すーぱー|n|siêu thị
ビル|びる|n|tòa nhà
アパート|あぱーと|n|căn hộ
オフィス|おふぃす|n|văn phòng
カフェ|かふぇ|n|quán cà phê
ホーム|ほーむ|n|sân ga
チケット|ちけっと|n|vé
ガイド|がいど|n|hướng dẫn viên
ツアー|つあー|n|chuyến tham quan
ドライブ|どらいぶ|n|lái xe dạo
バイク|ばいく|n|xe máy
トラック|とらっく|n|xe tải
ガソリン|がそりん|n|xăng
ニュースキャスター|にゅーすきゃすたー|n|phát thanh viên
アルバイト|あるばいと|n|việc làm thêm
サラリーマン|さらりーまん|n|nhân viên văn phòng
エンジニア|えんじにあ|n|kỹ sư
デザイン|でざいん|n|thiết kế
プログラム|ぷろぐらむ|n|chương trình
コンピューター|こんぴゅーたー|n|máy vi tính
ソフト|そふと|n|phần mềm
データ|でーた|n|dữ liệu
システム|しすてむ|n|hệ thống
サービス|さーびす|n|dịch vụ
ビジネス|びじねす|n|kinh doanh
マネージャー|まねーじゃー|n|quản lý
ミーティング|みーてぃんぐ|n|cuộc họp
スケジュール|すけじゅーる|n|lịch trình
カレンダー|かれんだー|n|lịch
ニュースレター|にゅーすれたー|n|bản tin
ポスト|ぽすと|n|hòm thư
カード|かーど|n|thẻ
レシート|れしーと|n|hóa đơn
セール|せーる|n|giảm giá
サイズ|さいず|n|kích cỡ
デザート|でざーと|n|món tráng miệng
ジム|じむ|n|phòng tập
ヨガ|よが|n|yoga
マラソン|まらそん|n|chạy marathon
チーム|ちーむ|n|đội
ルール|るーる|n|quy tắc
ボール|ぼーる|n|quả bóng
ライオン|らいおん|n|sư tử
パンダ|ぱんだ|n|gấu trúc
ペンギン|ぺんぎん|n|chim cánh cụt
キリン|きりん|n|hươu cao cổ
ウサギ|うさぎ|n|con thỏ
クリスマス|くりすます|n|Giáng sinh
ハンカチ|はんかち|n|khăn tay
カバン|かばん|n|cặp sách
ベトナム|べとなむ|n|Việt Nam
アメリカ|あめりか|n|nước Mỹ
フランス|ふらんす|n|nước Pháp
イギリス|いぎりす|n|nước Anh
`;

function parse(src: string): WordEntry[] {
  const seen = new Set<string>();
  return src
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [jp, kana, pos, vi] = l.split('|').map((x) => (x ?? '').trim());
      return { word: toRomaji(kana), jp, kana, pos, vi, meaning: '' } as WordEntry;
    })
    .filter((e) => {
      const key = `${e.jp}|${e.kana}`;
      if (!e.word || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const JA_DECKS: Deck[] = [
  {
    id: 'ja-n5',
    lang: 'ja',
    name: 'JLPT N5 Basics',
    nameVi: 'Từ vựng N5 cơ bản',
    icon: '🌸',
    level: 'Beginner · N5',
    description: 'Essential first words: people, time, numbers.',
    speed: 0.85,
    color: 'from-pink-400 to-rose-500',
    words: parse(N5_BASICS),
  },
  {
    id: 'ja-food',
    lang: 'ja',
    name: 'Food & Travel',
    nameVi: 'Ẩm thực & Du lịch Nhật',
    icon: '🍣',
    level: 'Elementary · N5–N4',
    description: 'Order ramen, ride the shinkansen, find the onsen.',
    speed: 0.9,
    color: 'from-orange-400 to-red-500',
    words: parse(FOOD_TRAVEL),
  },
  {
    id: 'ja-verbs',
    lang: 'ja',
    name: 'Verbs & Adjectives',
    nameVi: 'Động từ & Tính từ',
    icon: '⛩️',
    level: 'Intermediate · N4',
    description: 'Everyday actions and descriptive words.',
    speed: 0.95,
    color: 'from-red-500 to-purple-600',
    words: parse(VERBS_ADJ),
  },
  {
    id: 'ja-katakana',
    lang: 'ja',
    name: 'Katakana Loanwords',
    nameVi: 'Từ mượn Katakana',
    icon: '🗾',
    level: 'Mixed · Katakana',
    description: 'Long katakana words with ー and small kana.',
    speed: 1.0,
    color: 'from-indigo-400 to-sky-500',
    words: parse(KATAKANA),
  },
];
