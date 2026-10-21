import { Book } from '../types/book';

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'sample_little_prince',
    title: 'The Little Prince (小王子)',
    author: 'Antoine de Saint-Exupéry',
    format: 'epub',
    createdAt: 1700000000000,
    lastReadAt: Date.now(),
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'chap-lp-1',
        title: 'Chapter 21: The Secret of the Fox (狐狸的秘密)',
        paragraphs: [
          {
            id: 'lp-1',
            original: 'It was then that the fox appeared.',
            translation: '就在这时，狐狸出现了。',
          },
          {
            id: 'lp-2',
            original: '"Good morning," said the fox.',
            translation: '“早上好，”狐狸说。',
          },
          {
            id: 'lp-3',
            original: '"Good morning," the little prince replied politely, though when he turned around he saw nothing.',
            translation: '“早上好，”小王子礼貌地回答，虽然当他转过身时什么也没看见。',
          },
          {
            id: 'lp-4',
            original: '"I am right here," the voice said, "under the apple tree."',
            translation: '“我在这儿呢，”那个声音说，“在苹果树下。”',
          },
          {
            id: 'lp-5',
            original: '"Who are you?" asked the little prince. "You are very pretty to look at."',
            translation: '“你是谁？”小王子问，“你长得真漂亮。”',
          },
          {
            id: 'lp-6',
            original: '"I am a fox," the fox said.',
            translation: '“我是一只狐狸，”狐狸说。',
          },
          {
            id: 'lp-7',
            original: '"Come and play with me," proposed the little prince. "I am so unhappy."',
            translation: '“来和我一起玩吧，”小王子提议道，“我太难过了。”',
          },
          {
            id: 'lp-8',
            original: '"I cannot play with you," the fox said. "I am not tamed."',
            translation: '“我不能跟你玩，”狐狸说，“我还没有被驯化。”',
          },
          {
            id: 'lp-9',
            original: '"Ah! Please excuse me," said the little prince. But after some thought, he added: "What does that mean—\'tame\'?"',
            translation: '“啊！请原谅，”小王子说。但思考片刻后，他补充道：“‘驯化’是什么意思？”',
          },
          {
            id: 'lp-10',
            original: '"It is an act too often neglected," said the fox. "It means to establish ties."',
            translation: '“这是人们经常忽视的一件事，”狐狸说，“它的意思是‘建立羁绊’。”',
          },
          {
            id: 'lp-11',
            original: '"To establish ties?"',
            translation: '“建立羁绊？”',
          },
          {
            id: 'lp-12',
            original: '"Just that," said the fox. "To me, you are still nothing more than a little boy who is just like a hundred thousand other little boys. And I have no need of you. And you, on your part, have no need of me. To you, I am nothing more than a fox like a hundred thousand other foxes. But if you tame me, then we shall need each other. To me, you will be unique in all the world. To you, I shall be unique in all the world..."',
            translation: '“正是如此，”狐狸说，“对我而言，你还只是一个小男孩，和千千万万个小男孩没什么两样。我不需要你，你也同样不需要我。对你来说，我也只是一只狐狸，和千千万万只狐狸没有分别。但是，如果你驯化了我，我们就会彼此需要。对我来说，你将是世界上独一无二的；对你来说，我也将是世界上独一无二的……”',
          },
          {
            id: 'lp-13',
            original: '"And now here is my secret, a very simple secret: It is only with the heart that one can see rightly; what is essential is invisible to the eye."',
            translation: '“现在，这是我的秘密，一个非常简单的秘密：只有用心才能看得清实质；真正重要的东西，肉眼是看不见的。”',
          },
          {
            id: 'lp-14',
            original: '"It is the time you have wasted for your rose that makes your rose so important."',
            translation: '“正是你为你的玫瑰倾注的时间，才让你的玫瑰变得如此重要。”',
          },
        ],
      },
      {
        id: 'chap-lp-2',
        title: 'Chapter 1: The Boa Constrictor (巨蟒与画)',
        paragraphs: [
          {
            id: 'lp-2-1',
            original: 'Once when I was six years old I saw a magnificent picture in a book, called True Stories from Nature, about the primeval forest.',
            translation: '六岁那年，我在一本描写原始森林的名叫《真实的故事》的书中，看到了一幅极其壮丽的插图。',
          },
          {
            id: 'lp-2-2',
            original: 'It was a picture of a boa constrictor in the act of swallowing an animal. Here is a copy of the drawing.',
            translation: '那是一幅巨蟒正在吞食野兽的画。这就是那幅画的摹本。',
          },
          {
            id: 'lp-2-3',
            original: 'In the book it said: "Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion."',
            translation: '书中写道：“巨蟒把猎物整个吞下去，嚼都不嚼。之后它们便无法动弹，要沉睡整整六个月来消化食物。”',
          },
          {
            id: 'lp-2-4',
            original: 'I pondered deeply, then, over the adventures of the jungle. And after some work with a colored pencil I succeeded in making my first drawing. My Drawing Number One.',
            translation: '当时我对丛林中的冒险沉思良久。用彩色铅笔涂抹了一番之后，我成功完成了自己的第一幅画作。我的第一号画作。',
          },
          {
            id: 'lp-2-5',
            original: 'I showed my masterpiece to the grown-ups, and asked them whether the drawing frightened them. But they answered: "Frighten? Why should any one be frightened by a hat?"',
            translation: '我把这幅杰作拿给大人们看，问他们这幅画是否吓到了他们。但他们回答：“害怕？一顶帽子有什么好怕的？”',
          },
        ],
      },
    ],
  },
  {
    id: 'sample_alice_wonderland',
    title: 'Alice in Wonderland (爱丽丝梦游仙境)',
    author: 'Lewis Carroll',
    format: 'epub',
    createdAt: 1700000001000,
    lastReadAt: Date.now() - 3600000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'chap-alice-1',
        title: 'Chapter I: Down the Rabbit-Hole (掉进兔子洞)',
        paragraphs: [
          {
            id: 'alice-1',
            original: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.',
            translation: '爱丽丝坐在河岸边姐姐的身旁，无所事事，渐渐感到厌倦极了。',
          },
          {
            id: 'alice-2',
            original: 'Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversation?"',
            translation: '她曾有一两回偷偷瞧了瞧姐姐正在读的那本书，可书里既没有图画也没有对话。“一本既没有插图又没有对话的书，”爱丽丝心想，“能有什么意思呢？”',
          },
          {
            id: 'alice-3',
            original: 'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
            translation: '于是她心里暗自琢磨（天气热得她昏昏欲睡、脑子转得极慢）：编雏菊项圈的乐趣，是否值得她费力爬起来去采摘雏菊呢？就在这时，一只红眼睛的白兔突然从她身旁飞奔而过。',
          },
          {
            id: 'alice-4',
            original: 'There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!"',
            translation: '这本算不上什么特别稀奇的事；甚至当爱丽丝听到兔子自言自语说“天哪！天哪！我要迟到了！”时，她也没觉得有多么离谱。',
          },
          {
            id: 'alice-5',
            original: 'But when the Rabbit actually TOOK A WATCH OUT OF ITS WAISTCOAT-POCKET, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.',
            translation: '可是，当那只兔子真的从马甲口袋里掏出一块怀表看了看，然后急匆匆地继续往前赶时，爱丽丝猛地跳了起来——因为她脑海里灵光一闪：她以前可从来没见过哪只兔子穿着带口袋的马甲，更别说还能从中掏出一块怀表了！',
          },
          {
            id: 'alice-6',
            original: 'Burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.',
            translation: '怀着强烈的好奇心，她飞奔穿过田野追赶它，幸运的是，她刚好来得及看见它钻进了树篱下一个大大的兔子洞。',
          },
          {
            id: 'alice-7',
            original: 'In another moment down went Alice after it, never once considering how in the world she was to get out again.',
            translation: '转瞬之间，爱丽丝也跟着一头跳了下去，压根儿没考虑过到底该怎么再爬出来。',
          },
        ],
      },
    ],
  },
  {
    id: 'sample_chinese_luxun',
    title: '从百草园到三味书屋',
    author: '鲁迅',
    format: 'epub',
    createdAt: 1700000002000,
    lastReadAt: Date.now() - 7200000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'chap-luxun-1',
        title: '朝花夕拾：百草园的童年',
        paragraphs: [
          {
            id: 'lx-1',
            original: '我家的后面有一个很大的园，相传叫作百草园。现在是早已并屋子一起卖给朱姓的子孙了，连那最末次的相见也已经隔了七八年，其中似乎确凿只有一些野草；但那时却是我的乐园。',
          },
          {
            id: 'lx-2',
            original: '不必说碧绿的菜畦，光滑的石井栏，高大的皂荚树，紫红的桑椹；也不必说鸣蝉在树叶里长吟，肥胖的黄蜂伏在菜花上，轻捷的叫天子忽然从草间直窜向云霄里去了。',
          },
          {
            id: 'lx-3',
            original: '单是周围的短短的泥墙根一带，就有无限趣味。油蛉在这里低唱，蟋蟀们在这里弹琴。翻开断砖来，有时会遇见蜈蚣；还有斑蝥，倘若用手指按住它的脊梁，便会啪的一声，从后窍喷出一阵烟雾。',
          },
          {
            id: 'lx-4',
            original: '何首乌藤和木莲藤缠络着，木莲有莲房一般的果实，何首乌有臃肿的根。有人说，何首乌根是有像人形的，吃了便可以成仙，我于是常常拔它起来，牵连不断地拔起来，也曾因此弄坏了泥墙，却从来没有见过有一块根像人样。',
          },
          {
            id: 'lx-5',
            original: '冬天的百草园比较的无味；雪一下，可就两样了。拍雪人和塑雪罗汉需要人们鉴赏，这是荒园，人迹罕至，所以不相宜，只好来捕鸟。薄薄的雪是不行的；总须积雪盖了地面一两天，鸟雀们久已无处觅食的时候才好。扫开一块雪，露出地面，用一枝短棒支起一面大的竹筛来，下面撒些秕谷，棒上系一条长绳，人远远地牵着，看鸟雀下来啄食，走到竹筛底下的时候，将绳子一拉，便罩住了。',
          },
        ],
      },
    ],
  },
];
