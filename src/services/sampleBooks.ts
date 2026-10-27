import { Book } from '../types/book';

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book_broken_china',
    title: 'Broken China',
    author: 'Logan Wright',
    format: 'epub',
    coverUrl: '/covers/broken_china.jpg',
    createdAt: 1700000000000,
    lastReadAt: Date.now(),
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'bc-chap-1',
        title: 'Chapter 1: The Anatomy of a Slowdown (经济放缓的解构)',
        paragraphs: [
          {
            id: 'bc-1',
            original: 'For four decades, China’s economic ascent appeared almost unstoppable, defying conventional economic theory and global skepticism.',
            translation: '四十年来，中国的经济崛起似乎势不可挡，打破了传统经济学理论和全球质疑。',
          },
          {
            id: 'bc-2',
            original: 'Yet beneath the gleaming skylines and high-speed rail networks, structural imbalances were silently compounding across the financial system.',
            translation: '然而，在璀璨的天际线和高速铁路网络之下，金融体系内部的结构性失衡却在悄然累积。',
          },
          {
            id: 'bc-3',
            original: 'The core engine of this rapid expansion was property-driven investment financed by unprecedented local government debt mechanisms.',
            translation: '这一高速扩张的核心引擎是以房地产为主导的投资模式，其背后由前所未见的地方政府债务机制提供资金支撑。',
          },
          {
            id: 'bc-4',
            original: 'When demographic shifts and regulatory tightening cooled the property market, the multiplier effect reversed with alarming velocity.',
            translation: '当人口结构变化和监管收紧为房地产市场降温时，乘数效应以令人警惕的速度发生了反向运转。',
          },
          {
            id: 'bc-5',
            original: 'Understanding this transformation is crucial not only for analysts of Beijing, but for every participant in the interconnected global economy.',
            translation: '深刻理解这一转变，不仅对于研究北京的学者至关重要，对互联互通的全球经济中的每一位参与者亦是如此。',
          },
        ],
      },
      {
        id: 'bc-chap-2',
        title: 'Chapter 2: The Path Forward (未来的破局之路)',
        paragraphs: [
          {
            id: 'bc-2-1',
            original: 'Transitioning from debt-fueled investment toward domestic consumption requires fundamental reforms in social safety nets and fiscal distribution.',
            translation: '从依赖债务驱动的投资转向以国内消费为主导，需要对社会保障网络和财政分配体系进行深层次改革。',
          },
          {
            id: 'bc-2-2',
            original: 'High-tech manufacturing and green energy present immense opportunities, yet their sheer scale cannot immediately replace the real estate engine.',
            translation: '高端制造与绿色能源蕴藏着巨大的发展机遇，然而其目前的体量尚无法立刻完全替代庞大的房地产引擎。',
          },
        ],
      },
    ],
  },
  {
    id: 'book_industry_research',
    title: '如何快速了解一个行业',
    author: '麦肯锡前分析师',
    format: 'pdf',
    coverUrl: '/covers/industry_research.jpg',
    createdAt: 1700000001000,
    lastReadAt: Date.now() - 1800000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'ir-chap-1',
        title: '第1章：三步搭建行业全景认知框架',
        paragraphs: [
          {
            id: 'ir-1',
            original: '在商业世界中，快速看懂一个陌生行业不是依靠死记硬背数据，而是建立一套结构化的心智模型。',
          },
          {
            id: 'ir-2',
            original: '第一步是绘制产业链全景图：梳理上游原材料与供应商、中游生产制造与集成商、下游销售渠道与终端客户。',
          },
          {
            id: 'ir-3',
            original: '第二步是厘清行业的核心商业逻辑：谁在赚取最高利润率？哪一个环节拥有最高的定价权和转换壁垒？',
          },
          {
            id: 'ir-4',
            original: '第三步是追踪驱动行业演进的关键变量：包括宏观政策规制、核心技术迭代周期，以及终端消费者的行为变迁。',
          },
          {
            id: 'ir-5',
            original: '掌握了这三步方法论，哪怕面对一个完全陌生的领域，也能在48小时内抓住其命脉，并做出高胜率的商业判断。',
          },
        ],
      },
      {
        id: 'ir-chap-2',
        title: '第2章：拆解标杆企业的护城河',
        paragraphs: [
          {
            id: 'ir-2-1',
            original: '观察行业龙头的财务报表，重点看毛利率水平与研发投入占比，这是透视其竞争壁垒真伪的试金石。',
          },
          {
            id: 'ir-2-2',
            original: '网络效应、规模经济、专利与品牌溢价，这四种经典的护城河在数字经济时代正在被重新定义。',
          },
        ],
      },
    ],
  },
  {
    id: 'book_psychology',
    title: '津巴多普通心理学',
    author: '菲利普·津巴多',
    format: 'epub',
    coverUrl: '/covers/psychology.jpg',
    createdAt: 1700000002000,
    lastReadAt: Date.now() - 3600000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'psy-chap-1',
        title: '第1章：心灵、行为与心理科学',
        paragraphs: [
          {
            id: 'psy-1',
            original: 'Psychology is broadly defined as the scientific study of behavior and mental processes in all their diverse forms.',
            translation: '心理学被广泛定义为对各种形式的行为与心理过程进行严谨实证研究的科学。',
          },
          {
            id: 'psy-2',
            original: 'Modern psychologists pursue four primary goals: to describe what happens, to explain why it happens, to predict what will happen next, and to control or improve behavior.',
            translation: '现代心理学追求四大主要目标：描述发生了什么、解释为何发生、预测接下来会发生什么，以及控制或改善人类行为。',
          },
          {
            id: 'psy-3',
            original: 'Critical thinking is the lifeblood of psychological science—asking what the claim is, who is making it, and what empirical evidence supports it.',
            translation: '批判性思维是心理科学的生命线——始终追问主张是什么、由谁提出，以及有哪些实证数据作为支撑。',
          },
          {
            id: 'psy-4',
            original: 'Our thoughts, emotions, and decisions are constantly shaped by both biological inheritance and dynamic cultural environments.',
            translation: '我们的思想、情绪和决策，始终在生物基因遗传与动态文化环境的共同作用下被持续塑造。',
          },
        ],
      },
    ],
  },
  {
    id: 'book_dynamic_hedging',
    title: 'Dynamic Hedging',
    author: 'Nassim Taleb',
    format: 'pdf',
    coverUrl: '/covers/dynamic_hedging.jpg',
    createdAt: 1700000003000,
    lastReadAt: Date.now() - 7200000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'dh-chap-1',
        title: 'Chapter 1: Managing Vanilla and Exotic Options (动态对冲的核心原则)',
        paragraphs: [
          {
            id: 'dh-1',
            original: 'Dynamic hedging is the art and science of continually adjusting the hedge of a derivative portfolio as market prices and volatility fluctuate.',
            translation: '动态对冲是一门艺术与科学，它要求随着市场价格和波动率的波动，持续且动态地调整衍生品投资组合的对冲头寸。',
          },
          {
            id: 'dh-2',
            original: 'Theoretical option models assume frictionless continuous trading, but real market practitioners face liquidity black holes and transaction costs.',
            translation: '期权理论模型通常假设无摩擦的连续交易，但在现实市场中，交易员必须直面流动性黑洞与高昂的交易冲击成本。',
          },
          {
            id: 'dh-3',
            original: 'The volatility surface is not a flat plane; skewness and fat-tailed jumps govern the real survival probability of any options book.',
            translation: '波动率曲面绝非平坦的平面；偏度与肥尾跳跃实际上主宰着任何期权头寸的生死存亡概率。',
          },
          {
            id: 'dh-4',
            original: 'Delta neutrality alone cannot protect a portfolio against catastrophic gamma expansion during sudden regime changes.',
            translation: '在突发性的市场机制转换期间，单纯的 Delta 中性无法抵御巨额 Gamma 膨胀所带来的灾难性穿仓风险。',
          },
        ],
      },
    ],
  },
  {
    id: 'book_to_sell_is_human',
    title: 'To Sell is Human',
    author: 'Daniel H. Pink',
    format: 'epub',
    coverUrl: '/covers/to_sell_is_human.jpg',
    createdAt: 1700000004000,
    lastReadAt: Date.now() - 10800000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'sh-chap-1',
        title: 'Chapter 1: We\'re All in Sales Now (人人都离不开销售)',
        paragraphs: [
          {
            id: 'sh-1',
            original: 'One in nine American workers earns a living directly in sales. But the remaining eight in nine are engaged in "non-sales selling"—moving others to give up resources in exchange for what we offer.',
            translation: '每九个美国工作者中，就有一个直接从事销售职业。而其余的八个人，实际上也都在从事“非销售型销售”——打动他人付出资源以换取我们的提议。',
          },
          {
            id: 'sh-2',
            original: 'The traditional condition of sales was information asymmetry: the seller always held the advantage, summed up by the Latin maxim "caveat emptor" (buyer beware).',
            translation: '传统销售的基本前提是信息不对称：卖方永远占据优势，其典型体现就是拉丁谚语“买家自负其责”（买方警惕）。',
          },
          {
            id: 'sh-3',
            original: 'Today, the smartphone has flipped that equation into information parity. The new watchword is "caveat venditor"—seller beware.',
            translation: '如今，智能手机将这一天平逆转为信息对称。全新的市场警语变成了“买家当心变成卖家自省”（卖家警惕）。',
          },
          {
            id: 'sh-4',
            original: 'To move people in this transparent world requires three renewed human capabilities: Attunement, Buoyancy, and Clarity.',
            translation: '在这个信息透明的新世界里，打动他人需要三项焕然一新的人性能力：同理共鸣、浮力心态与洞察清晰度。',
          },
        ],
      },
    ],
  },
  {
    id: 'book_fourth_turning',
    title: 'The Fourth Turning',
    author: 'William Strauss & Neil Howe',
    format: 'epub',
    coverUrl: '/covers/fourth_turning.jpg',
    createdAt: 1700000005000,
    lastReadAt: Date.now() - 14400000,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    chapters: [
      {
        id: 'ft-chap-1',
        title: 'Chapter 1: The Cycles of American History (美洲历史的长周期循环)',
        paragraphs: [
          {
            id: 'ft-1',
            original: 'History is seasonal, and every season lasts roughly the length of a human life—about eighty to one hundred years.',
            translation: '历史如同四季更迭，每一个大周期（长纪，saeculum）的跨度大致相当于人类的一生——约八十至一百年。',
          },
          {
            id: 'ft-2',
            original: 'Each saeculum comprises four turnings: The High, The Awakening, The Unraveling, and The Fourth Turning—The Crisis.',
            translation: '每个长纪包含四个转折期：高潮期、觉醒期、解体期，以及第四个转折——决定命运的大危机期。',
          },
          {
            id: 'ft-3',
            original: 'During a Crisis, an unexpected spark ignites a chain reaction that tears down decayed institutional orders and demands a total civic reconstruction.',
            translation: '在危机期中，一个意料之外的火星就会点燃连锁反应，瓦解腐朽的旧体制秩序，并迫使整个社会进行彻底的公民重建。',
          },
          {
            id: 'ft-4',
            original: 'As generations replace one another, archetypes shift, carrying society inexorably through triumph, complacency, conflict, and renewal.',
            translation: '随着世代交替，代际原型不断演变，不可阻挡地带领着社会历经胜利辉煌、麻痹自满、解构纷争以及破茧新生。',
          },
        ],
      },
    ],
  },
  {
    id: 'sample_little_prince',
    title: 'The Little Prince (小王子)',
    author: 'Antoine de Saint-Exupéry',
    format: 'epub',
    createdAt: 1700000006000,
    lastReadAt: Date.now() - 20000000,
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
    ],
  },
];
