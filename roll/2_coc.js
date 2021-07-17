"use strict";
const rollbase = require('./rollbase.js');
var variables = {};

var gameName = function () {
	return '【克蘇魯神話】 cc cc(n)1~2 ccb ccrt ccsu .dp .cc7build .cc6build .cc7bg'
}

var gameType = function () {
	return 'Dice:CoC'
}
var prefixs = function () {
	return [{
		first: /(^ccrt$)|(^ccsu$)|(^cc7版創角$)|(^[.]cc7build$)|(^[.]ccpulpbuild$)|(^[.]cc6build$)|(^[.]cc7bg$)|(^cc6版創角$)|(^cc7版角色背景$)/i,
		second: null
	},
	{
		first: /(^ccb$)|(^cc$)|(^ccn[1-2]$)|(^cc[1-2]$)|(^[.]dp$)|(^成長檢定$)|(^幕間成長$)/i,
		second: /(^\d+$)|(^help$)/i
	}
	]
}
var getHelpMessage = async function () {
	return `【克蘇魯神話】
coc6版擲骰： ccb 80 技能小於等於80
coc7版擲骰： cc 80 技能小於等於80
coc7版獎勵骰： cc(1~2) cc1 80 一粒獎勵骰
coc7版懲罰骰： ccn(1~2) ccn2 80 兩粒懲罰骰
coc7版 即時型瘋狂： 啓動語 ccrt
coc7版 總結型瘋狂： 啓動語 ccsu
coc pulp版創角： 啓動語 .ccpulpbuild
coc6版創角： 啓動語 .cc6build
coc7版創角： 啓動語 .cc7build (歲數7-89)
coc7 成長或增長檢定： .dp 或 成長檢定 或 幕間成長 (技能%) (名稱)
例）.DP 50 騎馬 | 成長檢定 45 頭槌 | 幕間成長 40 單車
coc7版角色背景隨機生成： 啓動語 .cc7bg`
}
var initialize = function () {
	return variables;
}

var rollDiceCommand = async function ({
	mainMsg
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	let trigger = mainMsg[0].toLowerCase();
	//console.log(mainMsg[1].toLowerCase())
	if (trigger == "cc" && mainMsg[1].toLowerCase() == "help") {
		rply.text = await this.getHelpMessage();
	}
	if (trigger == ".dp" && (mainMsg[1].toLowerCase() == "help" || !mainMsg[1])) {
		rply.text = await this.getHelpMessage();
	}
	if (trigger.match(/(^ccrt$)/) != null) {
		rply.text = await ccrt();
	}
	if (trigger.match(/(^ccsu$)/) != null) {
		rply.text = await ccsu();
	}

	if (trigger == 'ccb' && mainMsg[1] <= 1000) {
		rply.text = await coc6(mainMsg[1], mainMsg[2]);
	}
	//DevelopmentPhase幕間成長指令開始於此
	if ((trigger == '.dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) {
		rply.text = await DevelopmentPhase(mainMsg[1], mainMsg[2]);
	}

	//cc指令開始於此
	if (trigger == 'cc' && mainMsg[1] <= 1000) {
		rply.text = await coc7(mainMsg[1], mainMsg[2]);
	}
	//獎懲骰設定於此	
	if (trigger == 'cc1' && mainMsg[1] <= 1000) {
		rply.text = await coc7bp(mainMsg[1], '1', mainMsg[2]);
	}
	if (trigger == 'cc2' && mainMsg[1] <= 1000) {
		rply.text = await coc7bp(mainMsg[1], '2', mainMsg[2]);
	}
	if (trigger == 'ccn1' && mainMsg[1] <= 1000) {
		rply.text = await coc7bp(mainMsg[1], '-1', mainMsg[2]);
	}
	if (trigger == 'ccn2' && mainMsg[1] <= 1000) {
		rply.text = await coc7bp(mainMsg[1], '-2', mainMsg[2]);
	}
	if (trigger.match(/(^cc7版創角$)|(^[.]cc7build$)/i) != null) {
		rply.text = await (await build7char(mainMsg[1])).replace(/\*5/ig, ' * 5');
	}
	if (trigger.match(/(^ccpulp版創角$)|(^[.]ccpulpbuild$)/i) != null) {
		rply.text = await (await buildpulpchar(mainMsg[1])).replace(/\*5/ig, ' * 5');
	}
	if (trigger.match(/(^cc6版創角$)|(^[.]cc6build$)/i) != null) {
		rply.text = await build6char(mainMsg[1]);
	}
	if (trigger.match(/(^cc7版角色背景$)|(^[.]cc7bg$)/i) != null) {
		rply.text = await PcBG();
	}
	return rply;
}


module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};


const oldArr = [15, 20, 40, 50, 60, 70, 80]
const DebuffArr = [5, 0, 5, 10, 20, 40, 80]
const AppDebuffArr = [0, 0, 5, 10, 15, 20, 25]
const EDUincArr = [0, 1, 2, 3, 4, 4, 4]


const OldArr2020 = [7, 8, 9, 10, 11, 12, 13, 14]
const EDUincArr2020 = [5, 10, 15, 20, 25, 30, 35, 40]

const PersonalDescriptionArr = ['結實的', '英俊的', '粗鄙的', '機靈的', '迷人的', '娃娃臉的', '聰明的', '蓬頭垢面的', '愚鈍的', '骯髒的', '耀眼的', '有書卷氣的', '青春洋溢的', '感覺疲憊的', '豐滿的', '粗壯的', '毛髮茂盛的', '苗條的', '優雅的', '邋遢的', '敦實的', '蒼白的', '陰沉的', '平庸的', '臉色紅潤的', '皮膚黝黑色', '滿臉皺紋的', '古板的', '有狐臭的', '狡猾的', '健壯的', '嬌俏的', '筋肉發達的', '魁梧的', '遲鈍的', '虛弱的'];
const IdeologyBeliefsArr = ['虔誠信仰著某個神祈', '覺得人類不需要依靠宗教也可以好好生活', '覺得科學可以解釋所有事，並對某種科學領域有獨特的興趣', '相信因果循環與命運', '是一個政黨、社群或秘密結社的成員', '覺得這個社會已經病了，而其中某些病灶需要被剷除', '是神秘學的信徒', '是積極參與政治的人，有特定的政治立場', '覺得金錢至上，且為了金錢不擇手段', '是一個激進主義分子，活躍於社會運動'];
const SignificantPeopleArr = ['他的父母', '他的祖父母', '他的兄弟姐妹', '他的孩子', '他的另一半', '那位曾經教導調查員最擅長的技能（點數最高的職業技能）的人', '他的兒時好友', '他心目中的偶像或是英雄', '在遊戲中的另一位調查員', '一個由KP指定的NPC'];
const SignificantPeopleWhyArr = ['調查員在某種程度上受了他的幫助，欠了人情', '調查員從他那裡學到了些什麼重要的東西', '他給了調查員生活的意義', '調查員曾經傷害過他，尋求他的原諒', '和他曾有過無可磨滅的經驗與回憶', '調查員想要對他證明自己', '調查員崇拜著他', '調查員對他有著某些使調查員後悔的過往', '調查員試圖證明自己和他不同，比他更出色', '他讓調查員的人生變得亂七八糟，因此調查員試圖復仇'];
const MeaningfulLocationsArr = ['過去就讀的學校', '他的故鄉', '與他的初戀之人相遇之處', '某個可以安靜沉思的地方', '某個類似酒吧或是熟人的家那樣的社交場所', '與他的信念息息相關的地方', '埋葬著某個對調查員別具意義的人的墓地', '他從小長大的那個家', '他生命中最快樂時的所在', '他的工作場所'];
const TreasuredPossessionsArr = ['一個與他最擅長的技能（點數最高的職業技能）相關的物品', '一件他的在工作上需要用到的必需品', '一個從他童年時就保存至今的寶物', '一樣由調查員最重要的人給予他的物品', '一件調查員珍視的蒐藏品', '一件調查員無意間發現，但不知道到底是什麼的東西，調查員正努力尋找答案', '某種體育用品', '一把特別的武器', '他的寵物'];
const TraitsArr = ['慷慨大方的人', '對動物很友善的人', '善於夢想的人', '享樂主義者', '甘冒風險的賭徒或冒險者', '善於料理的人', '萬人迷', '忠心耿耿的人', '有好名聲的人', '充滿野心的人'];

/**
 * COC恐懼表
 */
const cocmadnessrt = [
	['1)失忆：调查员会发现自己只记得最后身处的安全地点，却没有任何来到这里的记忆。例如，调查员前一刻还在家中吃著早饭，下一刻就已经直面著不知名的怪物。'],
	['2)假性残疾：调查员陷入了心理性的失明，失聪以及躯体缺失感中。'],
	['3)暴力倾向：调查员陷入了六亲不认的暴力行为中，对周围的敌人与友方进行着无差别的攻击。'],
	['4)偏执：调查员陷入了严重的偏执妄想之中。有人在暗中窥视著他们，同伴中有人背叛了他们，没有人可以信任，万事皆虚。'],
	['5)人际依赖：守秘人适当参考调查员的背景中重要之人的条目，调查员因为一些原因而将他人误认为了他重要的人并且努力的会与那个人保持那种关系。'],
	['6)昏厥：调查员当场昏倒。'],
	['7)逃避行为：调查员会用任何的手段试图逃离现在所处的位置，即使这意味著开走唯一一辆交通工具并将其它人抛诸脑后。'],
	['8)歇斯底里：调查员表现出大笑，哭泣，嘶吼，害怕等的极端情绪表现。'],
	['9)恐惧：调查员投一个D100或者由守秘人选择，来从恐惧症状表中选择一个恐惧源，就算这一恐惧的事物是并不存在的，调查员的症状会持续1D10 轮。'],
	['10)狂躁：调查员投一个D100 或者由守秘人选择，来从狂躁症状表中选择一个狂躁的诱因。']
];

const cocmadnesssu = [
	['1)失忆（Amnesia）：回过神来，调查员们发现自己身处一个陌生的地方，并忘记了自己是谁。记忆会随时间恢复。'],
	['2)被窃（Robbed）：调查员恢复清醒，发觉自己被盗，身体毫发无损。如果调查员携带著宝贵之物（见调查员背景），做幸运检定来决定其是否被盗。所有有价值的东西无需检定自动消失。'],
	['3)遍体鳞伤（Battered）：调查员恢复清醒，发现自己身上满是拳痕和瘀伤。生命值减少到疯狂前的一半，但这不会造成重伤。调查员没有被窃。这种伤害如何持续到现在由守秘人决定。'],
	['4)暴力倾向（Violence）：调查员陷入强烈的暴力与破坏欲之中。调查员回过神来可能会理解自己做了什么也可能毫无印象。调查员对谁或何物施以暴力，他们是杀人还是仅仅造成了伤害，由守秘人决定。'],
	['5)极端信念（Ideology/Beliefs）：查看调查员背景中的思想信念，调查员会采取极端和疯狂的表现手段展示他们的思想信念之一。比如一个信教者会在地铁上高声布道。'],
	['6)重要之人（Significant People）：考虑调查员背景中的重要之人，及其重要的原因。在1D10 小时或更久的时间中，调查员将不顾一切地接近那个人，并为他们之间的关系做出行动。'],
	['7)被收容（Institutionalized）：调查员在精神病院病房或警察局牢房中回过神来，他们可能会慢慢回想起导致自己被关在这里的事情。'],
	['8)逃避行为（Flee in panic）：调查员恢复清醒时发现自己在很远的地方，也许迷失在荒郊野岭，或是在驶向远方的列车或长途汽车上。'],
	['9)恐惧（Phobia）：调查员患上一个新的恐惧症。在表Ⅸ：恐惧症状表上骰1 个D100 来决定症状，或由守秘人选择一个。调查员在回过神来，并开始为避开恐惧源而采取任何措施。'],
	['10)狂躁（Mania）：调查员患上一个新的狂躁症。在表Ⅹ：狂躁症状表上骰1 个d100 来决定症状，或由守秘人选择一个。在这次疯狂发作中，调查员将完全沉浸于其新的狂躁症状。这症状是否会表现给旁人则取决于守秘人和此调查员。']
];

const cocManias = [
	['1) 沐浴癖（Ablutomania）：执著于清洗自己。'],
	['2) 犹豫癖（Aboulomania）：病态地犹豫不定。'],
	['3) 喜暗狂（Achluomania）：对黑暗的过度热爱。'],
	['4) 喜高狂（Acromaniaheights）：狂热迷恋高处。'],
	['5) 亲切癖（Agathomania）：病态地对他人友好。'],
	['6) 喜旷症（Agromania）：强烈地倾向于待在开阔空间中。'],
	['7) 喜尖狂（Aichmomania）：痴迷于尖锐或锋利的物体。'],
	['8) 恋猫狂（Ailuromania）：近乎病态地对猫友善。'],
	['9) 疼痛癖（Algomania）：痴迷于疼痛。'],
	['10) 喜蒜狂（Alliomania）：痴迷于大蒜。'],
	['11) 乘车癖（Amaxomania）：痴迷于乘坐车辆。'],
	['12) 欣快癖（Amenomania）：不正常地感到喜悦。'],
	['13) 喜花狂（Anthomania）：痴迷于花朵。'],
	['14) 计算癖（Arithmomania）：狂热地痴迷于数字。'],
	['15) 消费癖（Asoticamania）：鲁莽冲动地消费。'],
	['16) 隐居癖（Automania）：过度地热爱独自隐居。'],
	['17) 芭蕾癖（Balletmania）：痴迷于芭蕾舞。'],
	['18) 窃书癖（Biliokleptomania）：无法克制偷窃书籍的冲动。'],
	['19) 恋书狂（Bibliomania）：痴迷于书籍和/或阅读'],
	['20) 磨牙癖（Bruxomania）：无法克制磨牙的冲动。'],
	['21) 灵臆症（Cacodemomania）：病态地坚信自己已被一个邪恶的灵体占据。'],
	['22) 美貌狂（Callomania）：痴迷于自身的美貌。'],
	['23) 地图狂（Cartacoethes）：在何时何处都无法控制查阅地图的冲动。'],
	['24) 跳跃狂（Catapedamania）：痴迷于从高处跳下。'],
	['25) 喜冷症（Cheimatomania）：对寒冷或寒冷的物体的反常喜爱。'],
	['26) 舞蹈狂（Choreomania）：无法控制地起舞或发颤。'],
	['27) 恋床癖（Clinomania）：过度地热爱待在床上。'],
	['28) 恋墓狂（Coimetormania）：痴迷于墓地。'],
	['29) 色彩狂（Coloromania）：痴迷于某种顔色。'],
	['30) 小丑狂（Coulromania）：痴迷于小丑。'],
	['31) 恐惧狂（Countermania）：执著于经历恐怖的场面。'],
	['32) 杀戮癖（Dacnomania）：痴迷于杀戮。'],
	['33) 魔臆症（Demonomania）：病态地坚信自己已被恶魔附身。'],
	['34) 挠皮癖（Dermatillomania）：执著于抓挠自己的皮肤。'],
	['35) 正义狂（Dikemania）：痴迷于目睹正义被伸张。'],
	['36) 嗜酒狂（Dipsomania）：反常地渴求酒精。'],
	['37) 毛皮狂（Doramania）：痴迷于拥有毛皮。'],
	['38) 赠物癖（Doromania）：痴迷于赠送礼物。'],
	['39) 漂泊症（Drapetomania）：执著于逃离。'],
	['40) 漫游癖（Ecdemiomania）：执著于四处漫游。'],
	['41) 自恋狂（Egomania）：近乎病态地以自我为中心或自我崇拜。'],
	['42) 工作狂（Empleomania）：对于工作的无尽病态渴求。'],
	['43) 臆罪症（Enosimania）：病态地坚信自己带有罪孽。'],
	['44) 学识狂（Epistemomania）：痴迷于获取学识。'],
	['45) 静止癖（Eremiomania）：执著于保持安静。'],
	['46) 乙醚瘾（Etheromania）：渴求乙醚。'],
	['47) 求婚狂（Gamomania）：痴迷于进行奇特的求婚。'],
	['48) 狂笑癖（Geliomania）：无法自制地，强迫性的大笑。'],
	['49) 巫术狂（Goetomania）：痴迷于女巫与巫术。'],
	['50) 写作癖（Graphomania）：痴迷于将每一件事写下来。'],
	['51) 暴露狂（Gymnomania）：执著于裸露身体。'],
	['52) 妄想狂（Habromania）：近乎病态地充满愉快的妄想（而不顾现实状况如何）。'],
	['53) 蠕虫狂（Helminthomania）：过度地喜爱蠕虫。'],
	['54) 枪械狂（Hoplomania）：痴迷于枪械。'],
	['55) 饮水狂（Hydromania）：反常地渴求水分。'],
	['56) 喜鱼癖（Ichthyomania）：痴迷于鱼类。'],
	['57) 图标狂（Iconomania）：痴迷于图标与肖像'],
	['58) 偶像狂（Idolomania）：痴迷于甚至愿献身于某个偶像。'],
	['59) 信息狂（Infomania）：痴迷于积累各种信息与资料。'],
	['60) 射击狂（Klazomania）：反常地执著于射击。'],
	['61) 偷窃癖（Kleptomania）：反常地执著于偷窃。'],
	['62) 噪音癖（Ligyromania）：无法自制地执著于制造响亮或刺耳的噪音。'],
	['63) 喜线癖（Linonomania）：痴迷于线绳。'],
	['64) 彩票狂（Lotterymania）：极端地执著于购买彩票。'],
	['65) 抑郁症（Lypemania）：近乎病态的重度抑郁倾向。'],
	['66) 巨石狂（Megalithomania）：当站在石环中或立起的巨石旁时，就会近乎病态地写出各种奇怪的创意。'],
	['67) 旋律狂（Melomania）：痴迷于音乐或一段特定的旋律。'],
	['68) 作诗癖（Metromania）：无法抑制地想要不停作诗。'],
	['69) 憎恨癖（Misomania）：憎恨一切事物，痴迷于憎恨某个事物或团体。'],
	['70) 偏执狂（Monomania）：近乎病态地痴迷与专注某个特定的想法或创意。'],
	['71) 夸大癖（Mythomania）：以一种近乎病态的程度说谎或夸大事物。'],
	['72) 臆想症（Nosomania）：妄想自己正在被某种臆想出的疾病折磨。'],
	['73) 记录癖（Notomania）：执著于记录一切事物（例如摄影）'],
	['74) 恋名狂（Onomamania）：痴迷于名字（人物的、地点的、事物的）'],
	['75) 称名癖（Onomatomania）：无法抑制地不断重复某个词语的冲动。'],
	['76) 剔指癖（Onychotillomania）：执著于剔指甲。'],
	['77) 恋食癖（Opsomania）：对某种食物的病态热爱。'],
	['78) 抱怨癖（Paramania）：一种在抱怨时产生的近乎病态的愉悦感。'],
	['79) 面具狂（Personamania）：执著于佩戴面具。'],
	['80) 幽灵狂（Phasmomania）：痴迷于幽灵。'],
	['81) 谋杀癖（Phonomania）：病态的谋杀倾向。'],
	['82) 渴光癖（Photomania）：对光的病态渴求。'],
	['83) 背德癖（Planomania）：病态地渴求违背社会道德'],
	['84) 求财癖（Plutomania）：对财富的强迫性地渴望。'],
	['85) 欺骗狂（Pseudomania）：无法抑制地执著于撒谎。'],
	['86) 纵火狂（Pyromania）：执著于纵火。'],
	['87) 提问狂（Questiong-Asking Mania）：执著于提问。'],
	['88) 挖鼻癖（Rhinotillexomania）：执著于挖鼻子。'],
	['89) 涂鸦癖（Scribbleomania）：沉迷于涂鸦。'],
	['90) 列车狂（Siderodromomania）：认为火车或类似的依靠轨道交通的旅行方式充满魅力。'],
	['91) 臆智症（Sophomania）：臆想自己拥有难以置信的智慧。'],
	['92) 科技狂（Technomania）：痴迷于新的科技。'],
	['93) 臆咒狂（Thanatomania）：坚信自己已被某种死亡魔法所诅咒。'],
	['94) 臆神狂（Theomania）：坚信自己是一位神灵。'],
	['95) 抓挠癖（Titillomaniac）：抓挠物体的强迫倾向。'],
	['96) 手术狂（Tomomania）：对进行手术的不正常爱好。'],
	['97) 拔毛癖（Trichotillomania）：执著于拔下自己的头发。'],
	['98) 臆盲症（Typhlomania）：病理性的失明。'],
	['99) 嗜外狂（Xenomania）：痴迷于异国的事物。'],
	['100) 喜兽癖（Zoomania）：对待动物的态度近乎疯狂地友好。']

];

const cocPhobias = [
	['1) 洗澡恐惧症（Ablutophobia）：对于洗涤或洗澡的恐惧。'],
	['2) 恐高症（Acrophobia）：对于身处高处的恐惧。'],
	['3) 飞行恐惧症（Aerophobia）：对飞行的恐惧。'],
	['4) 广场恐惧症（Agoraphobia）：对于开放的（拥挤）公共场所的恐惧。'],
	['5) 恐鸡症（Alektorophobia）：对鸡的恐惧。'],
	['6) 大蒜恐惧症（Alliumphobia）：对大蒜的恐惧。'],
	['7) 乘车恐惧症（Amaxophobia）：对于乘坐地面载具的恐惧。'],
	['8) 恐风症（Ancraophobia）：对风的恐惧。'],
	['9) 男性恐惧症（Androphobia）：对于成年男性的恐惧。'],
	['10) 恐英症（Anglophobia）：对英格兰或英格兰文化的恐惧。'],
	['11) 恐花症（Anthophobia）：对花的恐惧。'],
	['12) 截肢者恐惧症（Apotemnophobia）：对截肢者的恐惧。'],
	['13) 蜘蛛恐惧症（Arachnophobia）：对蜘蛛的恐惧。'],
	['14) 闪电恐惧症（Astraphobia）：对闪电的恐惧。'],
	['15) 废墟恐惧症（Atephobia）：对遗迹或残址的恐惧。'],
	['16) 长笛恐惧症（Aulophobia）：对长笛的恐惧。'],
	['17) 细菌恐惧症（Bacteriophobia）：对细菌的恐惧。'],
	['18) 导弹/子弹恐惧症（Ballistophobia）：对导弹或子弹的恐惧。'],
	['19) 跌落恐惧症（Basophobia）：对于跌倒或摔落的恐惧。'],
	['20) 书籍恐惧症（Bibliophobia）：对书籍的恐惧。'],
	['21) 植物恐惧症（Botanophobia）：对植物的恐惧。'],
	['22) 美女恐惧症（Caligynephobia）：对美貌女性的恐惧。'],
	['23) 寒冷恐惧症（Cheimaphobia）：对寒冷的恐惧。'],
	['24) 恐钟表症（Chronomentrophobia）：对于钟表的恐惧。'],
	['25) 幽闭恐惧症（Claustrophobia）：对于处在封闭的空间中的恐惧。'],
	['26) 小丑恐惧症（Coulrophobia）：对小丑的恐惧。'],
	['27) 恐犬症（Cynophobia）：对狗的恐惧。'],
	['28) 恶魔恐惧症（Demonophobia）：对邪灵或恶魔的恐惧。'],
	['29) 人群恐惧症（Demophobia）：对人群的恐惧。'],
	['30) 牙科恐惧症（Dentophobia）：对牙医的恐惧。'],
	['31) 丢弃恐惧症（Disposophobia）：对于丢弃物件的恐惧（贮藏癖）。'],
	['32) 皮毛恐惧症（Doraphobia）：对动物皮毛的恐惧。'],
	['33) 过马路恐惧症（Dromophobia）：对于过马路的恐惧。'],
	['34) 教堂恐惧症（Ecclesiophobia）：对教堂的恐惧。'],
	['35) 镜子恐惧症（Eisoptrophobia）：对镜子的恐惧。'],
	['36) 针尖恐惧症（Enetophobia）：对针或大头针的恐惧。'],
	['37) 昆虫恐惧症（Entomophobia）：对昆虫的恐惧。'],
	['38) 恐猫症（Felinophobia）：对猫的恐惧。'],
	['39) 过桥恐惧症（Gephyrophobia）：对于过桥的恐惧。'],
	['40) 恐老症（Gerontophobia）：对于老年人或变老的恐惧。'],
	['41) 恐女症（Gynophobia）：对女性的恐惧。'],
	['42) 恐血症（Haemaphobia）：对血的恐惧。'],
	['43) 宗教罪行恐惧症（Hamartophobia）：对宗教罪行的恐惧。'],
	['44) 触摸恐惧症（Haphophobia）：对于被触摸的恐惧。'],
	['45) 爬虫恐惧症（Herpetophobia）：对爬行动物的恐惧。'],
	['46) 迷雾恐惧症（Homichlophobia）：对雾的恐惧。'],
	['47) 火器恐惧症（Hoplophobia）：对火器的恐惧。'],
	['48) 恐水症（Hydrophobia）：对水的恐惧。'],
	['49) 催眠恐惧症（Hypnophobia）：对于睡眠或被催眠的恐惧。'],
	['50) 白袍恐惧症（Iatrophobia）：对医生的恐惧。'],
	['51) 鱼类恐惧症（Ichthyophobia）：对鱼的恐惧。'],
	['52) 蟑螂恐惧症（Katsaridaphobia）：对蟑螂的恐惧。'],
	['53) 雷鸣恐惧症（Keraunophobia）：对雷声的恐惧。'],
	['54) 蔬菜恐惧症（Lachanophobia）：对蔬菜的恐惧。'],
	['55) 噪音恐惧症（Ligyrophobia）：对刺耳噪音的恐惧。'],
	['56) 恐湖症（Limnophobia）：对湖泊的恐惧。'],
	['57) 机械恐惧症（Mechanophobia）：对机器或机械的恐惧。'],
	['58) 巨物恐惧症（Megalophobia）：对于庞大物件的恐惧。'],
	['59) 捆绑恐惧症（Merinthophobia）：对于被捆绑或紧缚的恐惧。'],
	['60) 流星恐惧症（Meteorophobia）：对流星或陨石的恐惧。'],
	['61) 孤独恐惧症（Monophobia）：对于一人独处的恐惧。'],
	['62) 不洁恐惧症（Mysophobia）：对污垢或污染的恐惧。'],
	['63) 粘液恐惧症（Myxophobia）：对粘液（史莱姆）的恐惧。'],
	['64) 尸体恐惧症（Necrophobia）：对尸体的恐惧。'],
	['65) 数字8恐惧症（Octophobia）：对数字8的恐惧。'],
	['66) 恐牙症（Odontophobia）：对牙齿的恐惧。'],
	['67) 恐梦症（Oneirophobia）：对梦境的恐惧。'],
	['68) 称呼恐惧症（Onomatophobia）：对于特定词语的恐惧。'],
	['69) 恐蛇症（Ophidiophobia）：对蛇的恐惧。'],
	['70) 恐鸟症（Ornithophobia）：对鸟的恐惧。'],
	['71) 寄生虫恐惧症（Parasitophobia）：对寄生虫的恐惧。'],
	['72) 人偶恐惧症（Pediophobia）：对人偶的恐惧。'],
	['73) 吞咽恐惧症（Phagophobia）：对于吞咽或被吞咽的恐惧。'],
	['74) 药物恐惧症（Pharmacophobia）：对药物的恐惧。'],
	['75) 幽灵恐惧症（Phasmophobia）：对鬼魂的恐惧。'],
	['76) 日光恐惧症（Phenogophobia）：对日光的恐惧。'],
	['77) 胡须恐惧症（Pogonophobia）：对胡须的恐惧。'],
	['78) 河流恐惧症（Potamophobia）：对河流的恐惧。'],
	['79) 酒精恐惧症（Potophobia）：对酒或酒精的恐惧。'],
	['80) 恐火症（Pyrophobia）：对火的恐惧。'],
	['81) 魔法恐惧症（Rhabdophobia）：对魔法的恐惧。'],
	['82) 黑暗恐惧症（Scotophobia）：对黑暗或夜晚的恐惧。'],
	['83) 恐月症（Selenophobia）：对月亮的恐惧。'],
	['84) 火车恐惧症（Siderodromophobia）：对于乘坐火车出行的恐惧。'],
	['85) 恐星症（Siderophobia）：对星星的恐惧。'],
	['86) 狭室恐惧症（Stenophobia）：对狭小物件或地点的恐惧。'],
	['87) 对称恐惧症（Symmetrophobia）：对对称的恐惧。'],
	['88) 活埋恐惧症（Taphephobia）：对于被活埋或墓地的恐惧。'],
	['89) 公牛恐惧症（Taurophobia）：对公牛的恐惧。'],
	['90) 电话恐惧症（Telephonophobia）：对电话的恐惧。'],
	['91) 怪物恐惧症（Teratophobia）：对怪物的恐惧。'],
	['92) 深海恐惧症（Thalassophobia）：对海洋的恐惧。'],
	['93) 手术恐惧症（Tomophobia）：对外科手术的恐惧。'],
	['94) 十三恐惧症（Triskadekaphobia）：对数字13的恐惧症。'],
	['95) 衣物恐惧症（Vestiphobia）：对衣物的恐惧。'],
	['96) 女巫恐惧症（Wiccaphobia）：对女巫与巫术的恐惧。'],
	['97) 黄色恐惧症（Xanthophobia）：对黄色或“黄”字的恐惧。'],
	['98) 外语恐惧症（Xenoglossophobia）：对外语的恐惧。'],
	['99) 异域恐惧症（Xenophobia）：对陌生人或外国人的恐惧。'],
	['100) 动物恐惧症（Zoophobia）：对动物的恐惧。']

];

async function DevelopmentPhase(target, text) {
	let result = '';
	if (text == undefined) text = "";
	let skill = await rollbase.Dice(100);
	let improved = await rollbase.Dice(10);
	if (target > 95) target = 95;
	if (skill >= 96 || skill > target) {
		result = "成長或增強檢定: " + text + "\n1D100 > " + target + "\n擲出: " + skill + " → 成功!\n你的技能增加" + improved + "點!";
	} else {
		result = "成長或增強檢定: " + text + "\n1D100 > " + target + "\n擲出: " + skill + " → 失敗!\n你的技能沒有變化!";
	}
	return result;
}

async function ccrt() {
	let result = '';
	//var rollcc = Math.floor(Math.random() * 10);
	//var time = Math.floor(Math.random() * 10) + 1;
	//var PP = Math.floor(Math.random() * 100);
	let rollcc = await rollbase.Dice(10) - 1
	let time = await rollbase.Dice(10)
	let PP = await rollbase.Dice(100) - 1

	result = cocmadnessrt[rollcc] + '\n症状持续' + time + '轮数';

	return result;
}

async function ccsu() {
	let result = '';
	let rollcc = await rollbase.Dice(10) - 1
	let time = await rollbase.Dice(10)
	let PP = await rollbase.Dice(100) - 1
	result = cocmadnesssu[rollcc] + '\n症状持续' + time + '小时';
	return result;
}


/**
 * COC6
 * @param {數字 如CB 80 的80} chack 
 * @param {後面的文字,如偵查} text 
 */
async function coc6(chack, text) {
	let result = '';
	let temp = await rollbase.Dice(100);
	if (temp == 100) result = 'ccb<=' + chack + '\n' + temp + ' → 啊！大失敗！';
	else
		if (temp <= chack) result = 'ccb<=' + chack + '\n' + temp + ' → 成功';
		else result = 'ccb<=' + chack + '\n' + temp + ' → 失敗';
	if (text)
		result += '；' + text;
	return result;
}

/**
 * COC7
 * @param {CC 80 的80} chack 
 * @param {攻擊等描述字眼} text 
 */


async function coc7(chack, text) {
	let result = '';
	let temp = await rollbase.Dice(100);
	if (temp > chack) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 失敗';
	if (temp <= chack) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 通常成功';
	if (temp <= chack / 2) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 困難成功';
	if (temp <= chack / 5) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 極限成功';
	if (temp == 1) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 恭喜！大成功！';
	if (temp == 100) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 啊！大失敗！';
	if (temp >= 96 && chack <= 49) result = '1D100 ≦ ' + chack + "：\n" + temp + ' → 啊！大失敗！';
	if (text != null) result += '：' + text;
	return result;
}

async function coc7chack(temp, chack, text) {
	if (text == null) {
		if (temp == 1) return temp + ' → 恭喜！大成功！';
		if (temp == 100) return temp + ' → 啊！大失敗！';
		if (temp >= 96 && chack <= 49) return temp + ' → 啊！大失敗！';
		if (temp <= chack / 5) return temp + ' → 極限成功';
		if (temp <= chack / 2) return temp + ' → 困難成功';
		if (temp <= chack) return temp + ' → 通常成功';
		else return temp + ' → 失敗';
	} else {
		if (temp == 1) return temp + ' → 恭喜！大成功！：' + text;
		if (temp == 100) return temp + ' → 啊！大失敗！：' + text;
		if (temp >= 96 && chack <= 49) return temp + ' → 啊！大失敗！：' + text;
		if (temp <= chack / 5) return temp + ' → 極限成功：' + text;
		if (temp <= chack / 2) return temp + ' → 困難成功：' + text;
		if (temp <= chack) return temp + ' → 通常成功：' + text;
		else return temp + ' → 失敗：' + text;
	}
}



async function coc7bp(chack, bpdiceNum, text) {
	let result = '';
	let temp0 = await rollbase.Dice(10) - 1;
	let countStr = '';
	if (bpdiceNum > 0) {
		for (let i = 0; i <= bpdiceNum; i++) {
			let temp = await rollbase.Dice(10);
			let temp2 = temp.toString() + temp0.toString();
			if (temp2 > 100) temp2 = parseInt(temp2) - 100;
			countStr = countStr + temp2 + '、';
		}
		countStr = countStr.substring(0, countStr.length - 1)
		let countArr = countStr.split('、');
		countStr = countStr + ' → ' + await coc7chack(Math.min(...countArr), chack, text);
		result = '1D100 ≦ ' + chack + "：\n" + countStr;
		return result;
	}

	if (bpdiceNum < 0) {
		bpdiceNum = Math.abs(bpdiceNum);
		for (let i = 0; i <= bpdiceNum; i++) {
			let temp = await rollbase.Dice(10);
			let temp2 = temp.toString() + temp0.toString();
			if (temp2 > 100) temp2 = parseInt(temp2) - 100;
			countStr = countStr + temp2 + '、';
		}
		countStr = countStr.substring(0, countStr.length - 1)
		let countArr = countStr.split('、');
		countStr = countStr + ' → ' + await coc7chack(Math.max(...countArr), chack, text);
		result = '1D100 ≦ ' + chack + "：\n" + countStr;
		return result;
	}
}
async function buildpulpchar() {
	let ReStr = 'Pulp CoC 不使用年齡調整\n';
	//讀取年齡
	ReStr += '\nＳＴＲ：' + await rollbase.BuildDiceCal('3d6*5');
	ReStr += '\nＤＥＸ：' + await rollbase.BuildDiceCal('3d6*5');
	ReStr += '\nＰＯＷ：' + await rollbase.BuildDiceCal('3d6*5');

	ReStr += '\nＣＯＮ：' + await rollbase.BuildDiceCal('3d4*5');
	ReStr += '\nＡＰＰ：' + await rollbase.BuildDiceCal('3d6*5');
	ReStr += '\nＳＩＺ：' + await rollbase.BuildDiceCal('(2d6+6)*5');
	ReStr += '\nＩＮＴ：' + await rollbase.BuildDiceCal('(2d6+6)*5');


	ReStr += '\nＥＤＵ：' + await rollbase.BuildDiceCal('(2d6+6)*5');
	ReStr += '\nＬＵＫ：' + await rollbase.BuildDiceCal('(2d6+6)*5');
	ReStr += '\n核心屬性：' + await rollbase.BuildDiceCal('(1d6+13)*5');
	return ReStr;
}

/**
 * COC7傳統創角
 * @param {年齡} text01 
 */
async function build7char(text01) {
	let old = "";
	let ReStr = '調查員年齡設為：';
	//讀取年齡
	if (text01) old = text01.replace(/\D/g, '');
	if (old) {
		ReStr += old + '\n';
	} else {
		old = 18;
		ReStr += old + ' (沒有填寫歲數,使用預設值)\n';
	}
	//設定 因年齡減少的點數 和 EDU加骰次數
	let Debuff = 0;
	let AppDebuff = 0;
	let EDUinc = 0;


	if (old < 7) {
		ReStr += '\n等等，核心規則或日本拓展沒有適用小於7歲的人物哦。\n先當成15歲處理\n';
		old = 15;
	}

	if (old >= 7 && old <= 14) {
		ReStr += '\n等等，核心規則沒有適用小於15歲的人物哦。\n先使用日本CoC 7th 2020 拓展 - 7到14歲的幼年調查員規則吧\n';
	}
	if (old >= 90) {
		ReStr += '\n等等，核心規則沒有適用於90歲以上的人物哦。\n先當成89歲處理\n';
		old = 89;
	}
	for (let i = 0; old >= oldArr[i]; i++) {
		Debuff = DebuffArr[i];
		AppDebuff = AppDebuffArr[i];
		EDUinc = EDUincArr[i];
	}
	ReStr += '==\n';
	switch (true) {
		case (old >= 7 && old <= 14):
			{
				if (old >= 7 && old <= 12) {
					ReStr += '\nＳＴＲ：' + await rollbase.BuildDiceCal('3d4*5');
					ReStr += '\nＤＥＸ：' + await rollbase.BuildDiceCal('3d6*5');
					ReStr += '\nＰＯＷ：' + await rollbase.BuildDiceCal('3d6*5');

					ReStr += '\nＣＯＮ：' + await rollbase.BuildDiceCal('3d4*5');
					ReStr += '\nＡＰＰ：' + await rollbase.BuildDiceCal('3d6*5');
					ReStr += '\nＳＩＺ：' + await rollbase.BuildDiceCal('(2d3+6)*5');
					ReStr += '\nＩＮＴ：' + await rollbase.BuildDiceCal('(2d6+6)*5');

				}
				if (old >= 13 && old <= 14) {
					ReStr += '\nＳＴＲ：' + await rollbase.BuildDiceCal('(2d6+1)*5');
					ReStr += '\nＤＥＸ：' + await rollbase.BuildDiceCal('3d6*5');
					ReStr += '\nＰＯＷ：' + await rollbase.BuildDiceCal('3d6*5');

					ReStr += '\nＣＯＮ：' + await rollbase.BuildDiceCal('(2d6+1)*5');
					ReStr += '\nＡＰＰ：' + await rollbase.BuildDiceCal('3d6*5');
					ReStr += '\nＳＩＺ：' + await rollbase.BuildDiceCal('(2d4+6)*5');
					ReStr += '\nＩＮＴ：' + await rollbase.BuildDiceCal('(2d6+6)*5');

				}
				for (let i = 0; old >= OldArr2020[i]; i++) {
					EDUinc = EDUincArr2020[i];
				}
				ReStr += '\nＥＤＵ：' + EDUinc;
				ReStr += '\nＬＵＫ：' + await rollbase.BuildDiceCal('3d6*5');
				ReStr += '\nＬＵＫ加骰取高：' + await rollbase.BuildDiceCal('3D6*5');
				ReStr += '\n幼年調查員的特性：' + await rollbase.BuildDiceCal('2d6');
				ReStr += '\n幼年調查員的家境：' + await rollbase.BuildDiceCal('1D100');
				ReStr += '\n幼年調查員可受「幫忙」的次數：' + Math.round((17 - old) / 3);
				return ReStr;
			}

		case (old >= 15 && old <= 19):
			ReStr += '年齡調整：從STR或SIZ中減去' + Debuff + '點\n（請自行手動選擇計算）。\nEDU減去5點。LUK骰兩次取高。';
			ReStr += '\n==';
			ReStr += '\n（以下箭號兩項，減值' + Debuff + '點。）';
			break;
		case (old >= 20 && old <= 39):
			ReStr += '年齡調整：可做' + EDUinc + '次EDU的成長擲骰。';
			ReStr += '\n==';
			break;
		case (old >= 40 && old <= 49):
			ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
			ReStr += '\n==';
			ReStr += '\n（以下箭號三項，自選減去' + Debuff + '點。）';
			break;
		case (old >= 50):
			ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（從一，二或全部三項中選擇）\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
			ReStr += '\n==';
			ReStr += '\n（以下箭號三項，自選減去' + Debuff + '點。）';
			break;

		default:
			break;
	}
	ReStr += '\nＳＴＲ：' + await rollbase.BuildDiceCal('3d6*5');
	if (old >= 40) ReStr += ' ←（可選） ';
	if (old < 20) ReStr += ' ←（可選）';

	ReStr += '\nＤＥＸ：' + await rollbase.BuildDiceCal('3d6*5');
	if (old >= 40) ReStr += ' ← （可選）';

	ReStr += '\nＰＯＷ：' + await rollbase.BuildDiceCal('3d6*5');

	ReStr += '\nＣＯＮ：' + await rollbase.BuildDiceCal('3d6*5');
	if (old >= 40) ReStr += ' ← （可選）'

	if (old >= 40) {
		ReStr += '\nＡＰＰ：' + await rollbase.BuildDiceCal('(3d6*5)-' + AppDebuff)
	} else ReStr += '\nＡＰＰ：' + await rollbase.BuildDiceCal('3d6*5');


	ReStr += '\nＳＩＺ：' + await rollbase.BuildDiceCal('(2d6+6)*5');
	if (old < 20) {
		ReStr += ' ←（可選）';
	}

	ReStr += '\nＩＮＴ：' + await rollbase.BuildDiceCal('(2d6+6)*5');

	if (old < 20) ReStr += '\nＥＤＵ：' + await rollbase.BuildDiceCal('((2d6+6)*5)-5');
	else {
		let firstEDU = '(' + await rollbase.BuildRollDice('2d6') + '+6)*5';
		ReStr += '\n==';
		ReStr += '\nＥＤＵ初始值：' + firstEDU + ' = ' + eval(firstEDU);

		let tempEDU = eval(firstEDU);

		for (let i = 1; i <= EDUinc; i++) {
			let EDURoll = await rollbase.Dice(100);
			ReStr += '\n第' + i + '次EDU成長 → ' + EDURoll;
			if (EDURoll > tempEDU) {
				let EDUplus = await rollbase.Dice(10);
				ReStr += ' → 成長' + EDUplus + '點';
				tempEDU = tempEDU + EDUplus;
			} else {
				ReStr += ' → 沒有成長';
			}
		}
		ReStr += '\n';
		ReStr += '\nＥＤＵ最終值：' + tempEDU;
	}
	ReStr += '\n==';

	ReStr += '\nＬＵＫ：' + await rollbase.BuildDiceCal('3d6*5');
	if (old < 20) ReStr += '\nＬＵＫ加骰：' + await rollbase.BuildDiceCal('3D6*5');
	ReStr += '\n==\n煤油燈特徵: 1D6&1D20 → ' + await rollbase.Dice(6) + ',' + await rollbase.Dice(20);
	return ReStr;
}

/**
 * COC6傳統創角
 */



async function build6char() {
	/*	//讀取年齡
		if (text01 == undefined) text01 = 18;
		let old = text01;
		let ReStr = '調查員年齡設為：' + old + '\n';
		//設定 因年齡減少的點數 和 EDU加骰次數
		let Debuff = 0;
		let AppDebuff = 0;
		let EDUinc = 0;
		let oldArr = [15,20,40,50,60,70,80]
		let DebuffArr = [5,0,5,10,20,40,80]
		let AppDebuffArr = [0,0,5,10,15,20,25]
		let EDUincArr = [0,1,2,3,4,4,4]

		if (old < 15) rply.text = ReStr + '等等，核心規則不允許小於15歲的人物哦。';	
		if (old >= 90) rply.text = ReStr + '等等，核心規則不允許90歲以上的人物哦。'; 

		for (let i=0 ; old >= oldArr[i] ; i ++){
			Debuff = DebuffArr[i];
			AppDebuff = AppDebuffArr[i];
			EDUinc = EDUincArr[i];
		}
		ReStr  += '==\n';
		if (old < 20) ReStr  += '年齡調整：從STR、SIZ擇一減去' + Debuff + '點\n（請自行手動選擇計算）。\n將EDU減去5點。LUK可擲兩次取高。' ;
		else
			if (old >= 40)	ReStr  += '年齡調整：從STR、CON或DEX中「總共」減去' + Debuff + '點\n（請自行手動選擇計算）。\n將APP減去' + AppDebuff +'點。可做' + EDUinc + '次EDU的成長擲骰。' ;
		else ReStr  += '年齡調整：可做' + EDUinc + '次EDU的成長擲骰。' ;
		ReStr  += '\n=='; 
	 if (old>=40) ReStr  += '\n（以下箭號三項，自選共減' + Debuff + '點。）' ;
		if (old<20) ReStr  += '\n（以下箭號兩項，擇一減去' + Debuff + '點。）' ;
	 */
	let ReStr = '六版核心創角：';
	ReStr += '\nＳＴＲ：' + await rollbase.BuildDiceCal('3d6');
	ReStr += '\nＤＥＸ：' + await rollbase.BuildDiceCal('3d6');
	ReStr += '\nＣＯＮ：' + await rollbase.BuildDiceCal('3d6');
	ReStr += '\nＰＯＷ：' + await rollbase.BuildDiceCal('3d6');
	ReStr += '\nＡＰＰ：' + await rollbase.BuildDiceCal('3d6');
	ReStr += '\nＩＮＴ：' + await rollbase.BuildDiceCal('(2d6+6)');
	ReStr += '\nＳＩＺ：' + await rollbase.BuildDiceCal('(2d6+6)');
	ReStr += '\nＥＤＵ：' + await rollbase.BuildDiceCal('(3d6+3)');
	ReStr += '\n年收入：' + await rollbase.BuildDiceCal('(1d10)');
	ReStr += '\n調查員的最小起始年齡等於EDU+6，每比起始年齡年老十年，\n調查員增加一點EDU並且加20點職業技能點數。\n當超過40歲後，每老十年，\n從STR,CON,DEX,APP中選擇一個減少一點。';
	return ReStr;
}
//隨機產生角色背景
async function PcBG() {
	return '背景描述生成器（僅供娛樂用，不具實際參考價值）\n==\n調查員是一個' + PersonalDescriptionArr[await rollbase.Dice(PersonalDescriptionArr.length) - 1] + '人。\n【信念】：說到這個人，他' + IdeologyBeliefsArr[await rollbase.Dice(IdeologyBeliefsArr.length) - 1] + '。\n【重要之人】：對他來說，最重要的人是' + SignificantPeopleArr[await rollbase.Dice(SignificantPeopleArr.length) - 1] + '，這個人對他來說之所以重要，是因為' + SignificantPeopleWhyArr[await rollbase.Dice(SignificantPeopleWhyArr.length) - 1] + '。\n【意義非凡之地】：對他而言，最重要的地點是' + MeaningfulLocationsArr[await rollbase.Dice(MeaningfulLocationsArr.length) - 1] + '。\n【寶貴之物】：他最寶貴的東西就是' + TreasuredPossessionsArr[await rollbase.Dice(TreasuredPossessionsArr.length) - 1] + '。\n【特徵】：總括來說，調查員是一個' + TraitsArr[await rollbase.Dice(TraitsArr.length) - 1] + '。';
}