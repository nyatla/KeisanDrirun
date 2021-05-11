import {DebugTool,InvalidArgumentException as EARG,RuntimeError} from '../lib/_debug';
import {ExpNumber,XorShiftRandom} from '../lib/nmath';
import {j2t,TagCtrl} from '../lib/nstdlib';
import {AutoScale,QueryParser,DragdropHandler} from '../lib/uikit';
import '../extlib/less.min';
import $ from 'jquery';
window.$ = $;
window.jQuery = $;






/**
 * 問題１個分の情報クラス
 */
class IProblem{
	/**
	 * HTML形式の問題文（表示用）
	 * {html-string}
	 */
	get problem(){
		throw new Error();
	}
	/**
	 * String形式の回答（表示用）
	 * {string}
	 */
	get answerString(){
		throw new Error();
	}
	/**
	 * strが回答としてふさわしいかを返す。
	 * @param {*} str 
	 * @returns {bool}
	 */
	check(str){
		throw new Error();
	}
}
/**
 * 問題ビルダーの基本クラス
 */
class AProblemsBuilder{
	constructor(seed,descriptions)
	{
		this._rand=new XorShiftRandom(seed);
		this._descriptions=descriptions;
	}
	/**
	 * 問題文を返す {IProblem[]}
	 * @override
	 */
	get problems(){}
	/**
	 * title
	 */
	get title(){return this._descriptions?this._descriptions["title"]:"No description."}
}

/**
 * レイアウトのデバック用ダミー問題
 */
class DummyProblems extends AProblemsBuilder
{
	constructor(seed)
	{
		super(
			seed,{
				"title":"レイアウトデバック用",
				"hint":"BUY BITCOIN!"
			});
		class DummyProblem extends IProblem
		{
			/**
			 * 
			 * @param {*} problem_html 
			 * @param {*} answer 数値
			 */
			constructor(problem_html,answer,check){
				super();
				this._problem=problem_html;
				this._answer=answer;
				this._check=check;
			}
			get problem(){
				return this._problem;
			}
			get answerString(){
				return this._answer.toString();
			}
			/**
			 * strが回答としてふさわしいかを返す。
			 * @param {*} str 
			 * @returns 
			 */
			check(str){
				return this._check;
			}
		}
		let _t=this;
		let rand=this._rand;
		this._problems=[
			new DummyProblem(katex.renderToString("012345678901234567890123456789", {throwOnError: false}),"0123456789",true),
			new DummyProblem(katex.renderToString("012345678901234567890123456789", {throwOnError: false}),"0123456789",false)
		];
	}
	get problems(){
		return this._problems;
	}
}
////////////////////////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * ExpNumberの計算問題集ベースクラス
 */
class ExpNumberProblemBuilder extends AProblemsBuilder
{
	/**
	 * 
	 * @param {*} seed 
	 * @param {int[]} dparams 
	 * [fmin,fmax,dmin,dmax,emin,emax]
	 */
	constructor(seed,desc,dparams)
	{
		super(seed,desc);
		this._dparams=dparams?dparams:[1,999,-5,3,1,3];//デフォルトパラメータ
	}
	/**
	 * 範囲付きでExpNumberの乱数値を得る。
	 * @param {int} fmin 数値の最小値
	 * @param {int} fmax 数値の最大値
	 * @param {int} dmin 指数の最小値
	 * @param {int} dmax 指数の最大値
	 * @param {int} emin 有効桁の最低値
	 * @param {int} emax 有効桁の最大値
	 * @return {ExpNumber} f*10^d 有効桁数(emin<=e<=emax)
	 */
	_randomExFloat(fmin,fmax,dmin,dmax,emin,emax)
	{
		fmin=fmin===undefined?this._dparams[0]:fmin;
		fmax=fmax===undefined?this._dparams[1]:fmax;
		dmin=dmin===undefined?this._dparams[2]:dmin;
		dmax=dmax===undefined?this._dparams[3]:dmax;
		emin=emin===undefined?this._dparams[4]:emin;
		emax=emax===undefined?this._dparams[5]:emax;
		RuntimeError.ASSERT(emin>0);
		let rand=this._rand;
		for(;;){
			let f=Math.round(rand.nextInt31(fmin,fmax+1));
			let b=Math.round(rand.nextInt31(dmin,dmax+1));
			let e=Math.round(rand.nextInt31(emin,emax+1));
			let ef=ExpNumber.parseFloat(f*Math.pow(10,b),e);
			if(ef.floatValue==0){
				//0は返さないように。
				continue;
			}
			return ef;
		}
	}
	get problems(){
		return this._problems;
	}
}
class ExpNumberProblem extends IProblem{
	constructor(problem_html,answer){
		super();
		this._problem=problem_html;
		this._answer=answer;
	}
	get problem(){
		return this._problem;
	}
	get answerString(){
		return this._answer.toString(2);
	}
	/**
	 * strが回答としてふさわしいかを返す。
	 * @param {*} str 
	 * @returns 
	 */
	check(str){
		let n=ExpNumber.parseString(str);
		return (!n)?undefined:this._answer.eq(n);
	}
}

const X_EN_DESC=
{
	"title":"有効数字計算問題",
	"hint":"有効数字の計算ドリルです。答えは<b>1e10</b>や<b>-1.2e-10</b>と入力してください。<br/><b>1.2e-1</b>は<b>0.12</b>,<b>1.2*10^-2</b>,<b>12e-2</b>にもできますが、<b>1.2e2</b>を<b>120</b>にすることはできません。(有効数字が異なるため)"
};


class SumEnProblems extends ExpNumberProblemBuilder
{
	constructor(seed,n)
	{
		super(seed,{
			"title":"有効数字の足し算",
			"hint":X_EN_DESC["hint"]
		});
		class SumEnProblem extends ExpNumberProblem{
			constructor(l,r)
			{
				super(
					katex.renderToString(l.toString(3,true)+"+"+r.toString(3,true), {throwOnError: false}),
					ExpNumber.add(l,r));
			}
		}		
		let pbs=[];
		for(var i=0;i<n;i++){
			let l=this._randomExFloat();
			let r=this._randomExFloat();
			pbs.push(new SumEnProblem(l,r));
		}
		this._problems=pbs;
	}
}
class SubEnProblems extends ExpNumberProblemBuilder
{
	constructor(seed,n)
	{
		super(seed,{
			"title":"有効数字の引き算",
			"hint":X_EN_DESC["hint"]
		});
		class SubEnProblem extends ExpNumberProblem{
			constructor(l,r)
			{
				super(
					katex.renderToString(l.toString(3,true)+"-"+r.toString(3,true), {throwOnError: false}),
					ExpNumber.sub(l,r));
			}
		}
		let pbs=[];
		for(var i=0;i<n;i++){
			let l=this._randomExFloat();
			let r=this._randomExFloat();
			pbs.push(new SubEnProblem(l,r));
		}
		this._problems=pbs;
	}
}
class MulEnProblems extends ExpNumberProblemBuilder
{
	constructor(seed,n)
	{
		super(seed,{
			"title":"有効数字の掛け算",
			"hint":X_EN_DESC["hint"]
		});
		class MulEnProblem extends ExpNumberProblem{
			constructor(l,r)
			{
				super(
					katex.renderToString(l.toString(3,true)+"\\times"+r.toString(3,true), {throwOnError: false}),
					ExpNumber.mul(l,r));
			}
		}
		let pbs=[];
		for(var i=0;i<n;i++){
			let l=this._randomExFloat();
			let r=this._randomExFloat();
			pbs.push(new MulEnProblem(l,r));
		}
		this._problems=pbs;
	}
}
class DivEnProblems extends ExpNumberProblemBuilder
{
	constructor(seed,n)
	{
		super(seed,{
			"title":"有効数字の割り算",
			"hint":X_EN_DESC["hint"]
		});
		class DivEnProblem extends ExpNumberProblem{
			constructor(l,r)
			{
				super(
					katex.renderToString(l.toString(3,true)+"\\div"+r.toString(3,true), {throwOnError: false}),
					ExpNumber.sub(l,r));
			}
		}
		let pbs=[];
		for(var i=0;i<n;i++){
			let l=this._randomExFloat();
			let r=this._randomExFloat();
			pbs.push(new DivEnProblem(l,r));
		}
		this._problems=pbs;
	}
}
/*
 * ----------------------------------------------------------------------------------------------------------------
 */
const STD_N_DESC=
{
	"title":"計算問題",
	"hint":"整数の計算ドリルです。答えは数値のみを入力をしてください。"
};


class StdNumberProblem extends IProblem
{
	/**
	 * 
	 * @param {*} problem_html 
	 * @param {*} answer 数値
	 */
	constructor(problem_html,answer){
		super();
		this._problem=problem_html;
		this._answer=answer;
	}
	get problem(){
		return this._problem;
	}
	get answerString(){
		return this._answer.toString();
	}
	/**
	 * strが回答としてふさわしいかを返す。
	 * @param {*} str 
	 * @returns 
	 */
	check(str){
		let n=parseInt(str,10);
		return isNaN(n)?undefined:n==this._answer;
	}
	static createLinearExp(l,r,op,a){
		return new StdNumberProblem(katex.renderToString((l<0?"("+l+")":l)+op+(r<0?"("+r+")":r), {throwOnError: false}),a);
	}
}


function inRange(v,min,max){
	return min<=v && v<max;
}
function challangeLoop(loop,f){
	for(var i=0;i<loop;i++){
		if(f()==true){
			return;
		}
	}
	const message="challangeLoop Exception";
	console.log(message);
	alert(message);
	throw new Error(message);
}
/**
 * 2-3桁の整数同士の足し算
 */
class SumProblems extends AProblemsBuilder
{
	/**
	 * 
	 * @param {*} seed 
	 * @param {int[]} dparams 
	 * [left_min,left_max,right_min,right_max]
	 */
	constructor(seed,n,dparams)
	{
		super(
			seed,{
				"title":"整数の足し算",
				"hint":STD_N_DESC["hint"]
			});
		let _t=this;
		let rand=this._rand;
		dparams=dparams?dparams:[[10,1000],[10,1000],[0,0x7fffffff]];//デフォルトパラメータ(lの範囲,rの範囲,答えの範囲)
		let src=[];
		for(var i=0;i<n;i++){
			challangeLoop(1000,()=>{
				let l=rand.nextInt31(dparams[0][0],dparams[0][1]);
				let r=rand.nextInt31(dparams[1][0],dparams[1][1]);
				let a=l+r;
				if(!inRange(a,dparams[2][0],dparams[2][1])){return false;}//除外条件
				if(src.find((v)=>{return v[0]==l && v[1]==r;})){return false;}//同じのがあったらダメ
				src.push([l,r,a]);
				return true;
			});
		}
		this._problems=Array.from(src,x=>StdNumberProblem.createLinearExp(x[0],x[1],"+",x[2]));
	}
	get problems(){
		return this._problems;
	}
}
/**
 * 2-3桁の整数同士の引き算
 */
class SubProblems extends AProblemsBuilder
{
	/**
	 * 
	 * @param {*} seed 
	 * @param {int[]} dparams 
	 * [left_min,left_max,right_min,right_max]
	 */
	constructor(seed,n,dparams)
	{
		super(
			seed,{
				"title":"整数の引き算",
				"hint":STD_N_DESC["hint"]
			});
		let _t=this;
		let rand=this._rand;
		dparams=dparams?dparams:[[10,1000],[10,1000],[-0x7fffffff,0x7fffffff]];//デフォルトパラメータ(lの範囲,rの範囲,答えの範囲)
		let src=[];
		for(var i=0;i<n;i++){
			challangeLoop(1000,()=>{
				let l=rand.nextInt31(dparams[0][0],dparams[0][1]);
				let r=rand.nextInt31(dparams[1][0],dparams[1][1]);
				let a=l-r;
				if(!inRange(a,dparams[2][0],dparams[2][1])){return false;}//除外条件
				if(src.find((v)=>{return v[0]==l && v[1]==r;})){return false;}//同じのがあったらダメ
				src.push([l,r,a]);
				return true;
			});
		}
		this._problems=Array.from(src,x=>StdNumberProblem.createLinearExp(x[0],x[1],"-",x[2]));
	}
	get problems(){
		return this._problems;
	}
}
class MulProblems extends AProblemsBuilder
{
	/**
	 * 
	 * @param {*} seed 
	 * @param {int[]} dparams 
	 * [left_min,left_max,right_min,right_max]
	 */
	constructor(seed,n,dparams)
	{
		super(
			seed,{
				"title":"正の整数の掛け算",
				"hint":STD_N_DESC["hint"]
			});
		let _t=this;
		let rand=this._rand;
		dparams=dparams?dparams:[[1,999],[1,999],[0,0x7fffffff]];//デフォルトパラメータ(lの範囲,rの範囲,答えの範囲)
		let src=[];
		for(var i=0;i<n;i++){
			challangeLoop(1000,()=>{
				let l=rand.nextInt31(dparams[0][0],dparams[0][1]);
				let r=rand.nextInt31(dparams[1][0],dparams[1][1]);
				let a=l*r;
				if(!inRange(a,dparams[2][0],dparams[2][1])){return false;}//除外条件
				if(src.find((v)=>{return v[0]==l && v[1]==r;})){return false;}//同じのがあったらダメ
				src.push([l,r,a]);
				return true;
			});
		}
		this._problems=Array.from(src,x=>StdNumberProblem.createLinearExp(x[0],x[1],"\\times",x[2]));
	}
	get problems(){
		return this._problems;
	}
}



class ProblemRow extends TagCtrl
{
	constructor(p,n){
		super();
		this._problem=p;
		this._number=n;
	}
	get html(){
		return j2t(["li",[
			["div",[
				["div","問題&nbsp;"+this._number],
				["div",this._problem.problem],
			]],
			["div",[
				["div",{"class":"antxt"},"答え"],
				["input",{"type":"text","class":"answer"},""]
			]
			]]]);
	}
	bind(tag){
		let _t=this._number;
		super.bind(tag);
		// tag.children("div:nth-child(3) > *").on("click",()=>{alert(_t);});
	}
	/**
	 * 
	 * @returns 0=正解,1=不正解,2=無回答
	 */
	confirmAnswer(){
		let tag=this.tag;
		let tip=tag.find(".antxt");
		let val=tag.find(".answer").val().trim();
		if(this._problem.check(val)){
			tip.text("〇 正解").css({"background-color":"green","color":"white","border-radius":"0.25em"});
			tag.css({"background-color":"lightgreen"});
			return 0;
		}else{
			tip.text("× 回答:"+this._problem.answerString).css({"background-color":"red","color":"white","border-radius":"0.25em"});
			tag.css({"background-color":"lightpink"});
			return val.length==0?2:1;
		}
	}
	
}
class Score extends TagCtrl{
	constructor(app,ptbl){
		super();
		this.ptbl=ptbl;
		this.app=app;
	}
	get html(){
		return j2t([
				["div",[["button",{"id":"b1"},"採点する"]],],
				["div",{"class":"nonactive"},[
					["div",{"class":"score"},""],
					["div",{"class":"details"},""],
					["button",{"id":"b2"},"ツイッターに投擲"]
					]
				],
			
		]);
	}
	bind(tag){
		function ui(s,_score,_details){
			let n=s?Math.floor(s[0]*100/(s[0]+s[1]+s[2])):"-";
			_score.html(j2t([["span",n.toString()],["span","点"]]));
			s=s?s:[0,0,0];
			_details.text("正解:"+s[0]+" 不正解:"+s[1]+" 無回答:"+s[2]);
		}
		let _t=this;
		super.bind(tag);
		let _score=tag.find(".score");
		let _details=tag.find(".details");
		let _bn1=tag.find("#b1");
		let _bn2=tag.find("#b2");
		let score=ui(undefined,_score,_details);
		_bn1.on("click",()=>{
			let s=_t.ptbl.confirmAnswer();
			_bn1.prop("disabled", true).text("採点済み");
			_bn2.css({"background-color":"#00acee"}).prop("disabled",false);
			tag.find("div").css({"color":"black"});
			ui(s,_score,_details);
			_t.app.last_score=Math.floor(s[0]*100/(s[0]+s[1]+s[2]));
		});
		_bn2.on("click",()=>{
			TwitterLink.messageWindow(_t.app.description+"\n"+"点数は"+_t.app.last_score+"点でした。\n",_t.app.hashtag,_t.app.url);
		});
		_bn2.css({"background-color":"#cccccc"}).prop("disabled", true);
		tag.find("div").css({"color":"#cccccc"});

	}
}

class ProblemTable extends TagCtrl{
	constructor(problems)
	{
		super();
		let pa=problems.problems;
		this._p=[];
		for(var i=0;i<pa.length;i++){
			this._p.push(new ProblemRow(pa[i],i+1));
		}
	}
	get html(){
		return j2t(["ul",
			(()=>{
				let r=[];
				for(var i=0;i<this._p.length;i++){
					r.push(this._p[i].html);
				}
				return r;
			})(),
		]);
	}
	bind(tag){
		super.bind(tag);
		let tags=tag.find("li");
		let rows=[];
		for(var i=0;i<this._p.length;i++){
			this._p[i].bind($(tags[i]));
		}
	}
	confirmAnswer(){
		let score=[0,0,0];//pass,fail,nothing
		this._p.forEach((i)=>{
			score[i.confirmAnswer()]++;
		});
		return score;
	}
}

class ShareButton extends TagCtrl{
	constructor(app){
		super();
		this.app=app;
	}
	get html(){
		/**
		 */
		return '<i class="fab fa-twitter-square"></i>';
	}
	bind(tag){
		const _t=this;
		super.bind(tag);
		let _bn=tag.find("i");
		_bn.on("click",()=>{
			TwitterLink.messageWindow("ブラウザ用の計算ドリル - ("+_t.app.description+")",_t.app.hashtag,_t.app.url);
		});
	}
}



class App{
	constructor(){
		let q=new QueryParser();
		this.seed=q.optInt("s",Math.floor(Math.random()*0x7fffffff));
		this.mode=q.optStr("m","dbg");
	}
	get hashtag(){
		return "計算ドリルん";
	}
	get url(){
		return "./index.html?m="+this.mode+"&s="+this.seed;
	}
	get description(){
		return this.problems.title+" 問題シード"+this.seed;
	}
	run(){
		this.problems=((mode,seed)=>
		{
			switch(mode)
			{
				case "dbg":return new DummyProblems();
				case "esum":return new SumEnProblems(seed,10);
				case "esub":return new SubEnProblems(seed,10);
				case "emul":return new MulEnProblems(seed,10);
				//case "ediv":return new DivEnProblems(seed,10);
				case "sum":return new SumProblems(seed,10);
				case "sub":return new SubProblems(seed,10);
				case "mul":return new MulProblems(seed,10);
				default:
					return undefined;
			}
		})(this.mode,this.seed);
		this.pt=new ProblemTable(this.problems);
		this.pt.render($("#main"));
		let sc=new Score(this,this.pt);
		sc.render($("#score"));
		let sb=new ShareButton(this);
		sb.render($("#header"));
		new AutoScale(0,24);
	}
}

$(document).ready(function()
{
	const VERSION="20210420.01";
	(new App()).run();
});


