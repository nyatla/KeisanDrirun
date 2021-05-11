/**
 * 数学系のライブラリ
 */


function _ASSERT(e,m){
	if(!e){
		throw new Error("Invalid argument");
	}
}

/**
 * 有効桁数付きの実数演算クラス
 * _n*10^_bで実数値を表現する。_nは整数でその桁数が有効数字。
 * イミュータブルオブジェクトです。
 */
export class ExpNumber
{
	/**
	 * 
	 * @param {int} number 
	 * number*10^baseのnumber値。
	 * @param {int} base 
	 * number*10^baseのbase値。
	 */
	constructor(number,base)
	{
		_ASSERT(number%1==0);
		_ASSERT(base%1==0);
		//指数表記に変換
		//console.log("Constructor",number,base);
		this._n=number;
		this._b=base;
	}
	/**
	 * float型と有効桁数から値を生成する。
	 * parseFloat(12.3,2)の場合、12になる。
	 * @param {*} f 数値
	 * @param {*} decimal 有効桁数
	 * @returns 
	 */
	static parseFloat(f,decimal){
		//有効桁に寄らず0
		if(f==0){
			return new ExpNumber(0,0);
		}
		let b=Math.floor(Math.log10(Math.abs(f)))-(decimal-1);//基数
		let t=Math.round(f/Math.pow(10,b));
		return new ExpNumber(t,b);
	}
	/**
	 * 小数点表記文字列をパースする。
	 * NeM | N*10^M | N.M
	 * N.Mの場合、有効数字はNとMの桁の合計数。ただしNが0の場合はM桁
	 * @param {*} s 
	 * @returns 
	 */
	 static parseString(s)
	 {
		let parse=ExpNumber.parseString;

		if(/^-?[0-9]*(\.[0-9]*)?e-?[0-9]*$/.test(s))
		{	// NeM表記
			let w=s.split("e");				
			let u=parse(w[0]);
			if(!u){
				return undefined;
			}
			//uの小数点位置をずらす
			return u.shift10(parseInt(w[1]));
		}else if(/^^-?[0-9]*(\.[0-9]*)?\*10\^-?[0-9]*$/.test(s))
		{//N*10^M表記
			return parse(s.replace("*10^","e"));
		}else if(/^-?[0-9]*(\.[0-9]*)?$/.test(s)){
			//N.M表記
			let w=s.split(".");
			switch(w.length){
				case 1:
					if(w[0].length==0){
						return undefined;
					}
					return new ExpNumber(parseInt(w[0]),0);
				case 2:{
					if(w[0].length==0 || parseInt(w[0])==0)
					{	// .M | 0+.M
						return new ExpNumber(parseInt(w[1]),-w[1].length);
					}
					//N.M
					return new ExpNumber(parseInt(w[0]+w[1]),-w[1].length);
				}
				default:
					return undefined;
			}
		}else{
			return undefined;
		}
	}



	/**
	 * float型の値を返す。
	 * @returns
	 */
	get floatValue()
	{
		return this._n*Math.pow(10,this._b);
	}
	/**
	 * 有効数字の桁数を返す。
	 * 数値が0の場合は1
	 */
	get significantDigits(){
		if(this._n==0){
			return 1;
		}
		return Math.floor(Math.log10(Math.abs(this._n)))+1;
	}
	/**
	 * 符号を反転したインスタンスを返します。
	 * @param {*} l 
	 * @returns {int}
	 */
	inversSign(){
		return new ExpNumber(-this._n,this._b); 
	}
	/**
	 * 指数部を10^nシフトしたインスタンスを返します。
	 * @param {*} n 
	 */
	shift10(n){
		return new ExpNumber(this._n,this._b+n);
	}
	/**
	 * 同じ値かを返す。
	 * @param {ExpNumber} n 
	 * @returns bool
	 */
	eq(n){
		return this._n==n._n && this._b==n._b;
	}
	/**
	 * @param {int|undefined} format
	 * u 整数|少数表記
	 * 1 指数表記1(1.00*10^2)
	 * 2 指数表記2(1.00e2)
	 * 3 指数表記3(1.00\times10^2)
	 * @param {bool} omit_zero_exp
	 * format>0の場合、指数部0の場合に省略。
	 * @returns 
	 */
	toString(format,omit_zero_exp)
	{
		if(this._n==0){
			return "0";
		}
		if(this._n<0){
			return "-"+(new ExpNumber(-this._n,this._b)).toString(format);
		}
		let b=this._b;
		if(format)
		{
			function fmt(n,d,op){
				let w=n.toString();
				w=w.substring(0,1)+((d>1)?("."+w.substring(1,d)):"");
				let t=(b+s-1);
				let f=(omit_zero_exp===true && t==0)?"":(op+t);
				return w+f;
			}
			function fmtTex(n,d){
				let w=n.toString();
				w=w.substring(0,1)+((d>1)?("."+w.substring(1,d)):"");
				let t=(b+s-1);
				let f=(omit_zero_exp===true && t==0)?"":("\\times10^{"+t+"}");
				return w+f;
			}
			//console.log(format);
			let s=this.significantDigits;
			switch(format){
			case 1:return fmt(this._n,s,"*10^");
			case 2:return fmt(this._n,s,"e");
			case 3:return fmtTex(this._n,s);
			default:
			throw new Error("Invalid format");
			}
		}else{
			if(b>=0){
				return (this._n*Math.pow(10,b)).toString();
			}
			let s=this._n.toString();
			let k=Math.floor(Math.log10(this._n))+1;//整数桁数
			let l=-b;//小数点桁数
			if(k<=l){
				for(var i=0;i<=l-k;i++){
					s="0"+s;
				}
			}
			return s.substring(0,s.length-l)+"."+s.substring(s.length-l);
		}
	}
	static sub(l,r){
		if(l._n*r._n==0){
			//どちらかが0なら、lか-rを返す。
			return l._n!=0?l:r.inversSign();
		}
		let b=Math.max(l._b,r._b);
		let v=Math.round((l.floatValue-r.floatValue)/Math.pow(10,b));
		//console.log(v,b);
		return new ExpNumber(v,b);
	}
	static add(l,r){
		return ExpNumber.sub(l,r.inversSign());
	}
	static mul(l,r){
		if(l._n*r._n==0){
			return new ExpNumber(0,0);
		}
		let v=l.floatValue*r.floatValue;
		let sd=Math.min(l.significantDigits,r.significantDigits);
		return ExpNumber.parseFloat(v,sd);
	}
	static div(l,r)
	{
		if(r._n==0){
			throw new Err
			return undefined;
		}
		if(l._n==0){
			return l;
		}
		let v=l.floatValue/r.floatValue;
		let sd=Math.min(l.significantDigits,r.significantDigits);
		return ExpNumber.parseFloat(v,sd);
	}
	static test(){
		function check(n,s){
			let w=n.toString();
			console.log(((w==s)?"PASS":"FAIL")+":"+s+"->"+w+" "+n.toString(1));
		}
		let N=ExpNumber.parseFloat;
		console.log("toString");
		check(N(0,1),"0");
		check(N(0.12,1),"0.1");
		check(N(0.12,2),"0.12");
		check(N(0.12,3),"0.120");
		check(N(1.23,2),"1.2");
		check(N(1.23,3),"1.23");
		check(N(1.0001,5),"1.0001");
		check(N(0.00012,2),"0.00012");
		check(N(11,1),"10");
		check(N(15,1),"20");
		check(N(-1.0001,5),"-1.0001");
		check(N(-1.0201,3),"-1.02");
		console.log("sub");
		check(ExpNumber.sub(N(0,0),N(12.3,3)),"-12.3");
		check(ExpNumber.sub(N(1.23,3),N(0,0)),"1.23");
		check(ExpNumber.sub(N(123,3),N(123,3)),"0");
		check(ExpNumber.sub(N(123,2),N(112,3)),"10");
		check(ExpNumber.sub(N(12.3,3),N(1.19,2)),"11.1");
		check(ExpNumber.sub(N(1.19,2),N(12.3,3)),"-11.1");
		check(ExpNumber.sub(N(0.1999,1),N(12.39,4)),"-12.2");
		check(ExpNumber.sub(N(12.39,4),N(0.1999,1)),"12.2");
		check(ExpNumber.sub(N(12.39,4),N(0.0001,1)),"12.39");
		check(ExpNumber.sub(N(12.39,3),N(0.0001,1)),"12.4");
		console.log("add");
		check(ExpNumber.add(N(0,0),N(12.3,3)),"12.3");
		check(ExpNumber.add(N(1.23,3),N(0,0)),"1.23");
		check(ExpNumber.add(N(123,3),N(123,3)),"246");
		check(ExpNumber.add(N(123,2),N(112,3)),"230");
		check(ExpNumber.add(N(12.3,3),N(1.19,2)),"13.5");
		check(ExpNumber.add(N(1.19,2),N(12.3,3)),"13.5");
		check(ExpNumber.add(N(0.1999,1),N(12.39,4)),"12.6");
		check(ExpNumber.add(N(12.39,4),N(0.1999,1)),"12.6");
		check(ExpNumber.add(N(12.39,4),N(0.0001,1)),"12.39");
		check(ExpNumber.add(N(12.39,3),N(0.0001,1)),"12.4");
		console.log("mul");
		check(ExpNumber.mul(N(0,0),N(12.3,3)),"0");
		check(ExpNumber.mul(N(1.23,3),N(0,0)),"0");
		check(ExpNumber.mul(N(123,3),N(123,3)),"15100");
		check(ExpNumber.mul(N(123,2),N(112,3)),"13000");
		check(ExpNumber.mul(N(12.3,3),N(1.19,2)),"15");
		check(ExpNumber.mul(N(1.19,2),N(12.3,3)),"15");
		check(ExpNumber.mul(N(0.1999,1),N(12.39,4)),"2");
		check(ExpNumber.mul(N(12.39,4),N(0.1999,1)),"2");
		check(ExpNumber.mul(N(12.39,4),N(0.0001,1)),"0.001");
		check(ExpNumber.mul(N(12.39,3),N(0.0001,1)),"0.001");
		check(ExpNumber.mul(N(-0.1999,1),N(12.39,4)),"-2");
		check(ExpNumber.mul(N(0.1999,1),N(-12.39,4)),"-2");
		check(ExpNumber.mul(N(-0.1999,1),N(-12.39,4)),"2");
		console.log("div");
		check(ExpNumber.div(N(0,0),N(12.3,3)),"0");
		// check(ExpNumber.div(N(1.23,3),N(0,0)),"0");
		check(ExpNumber.div(N(123,3),N(123,3)),"1.00");
		check(ExpNumber.div(N(123,2),N(112,3)),"1.1");
		check(ExpNumber.div(N(12.3,3),N(1.19,2)),"10");
		check(ExpNumber.div(N(1.19,2),N(12.3,3)),"0.098");
		check(ExpNumber.div(N(0.1999,1),N(12.39,4)),"0.02");
		check(ExpNumber.div(N(12.39,4),N(0.1999,1)),"60");
		check(ExpNumber.div(N(12.39,4),N(0.0001,1)),"100000");
		check(ExpNumber.div(N(12.39,3),N(0.0001,1)),"100000");
		check(ExpNumber.div(N(-0.1999,1),N(12.39,4)),"-0.02");
		check(ExpNumber.div(N(0.1999,1),N(-12.39,4)),"-0.02");
		check(ExpNumber.div(N(-0.1999,1),N(-12.39,4)),"0.02");
		console.log("parseString");
		console.log(ExpNumber.parseString("123"));
		console.log(ExpNumber.parseString("123.45"));
		console.log(ExpNumber.parseString("123."));
		console.log(ExpNumber.parseString(".0123"));
		console.log(ExpNumber.parseString("123.5e1"));
		console.log(ExpNumber.parseString("123.5e-2"));
		console.log(ExpNumber.parseString(".5e-1"));
		console.log(ExpNumber.parseString("5.e-2"));
		console.log(ExpNumber.parseString("5e-2"));
	}
}

/**
 * https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/
 */
export class XorShiftRandom
{
	constructor(seed = 88675123) {
	  this.x = 123456789;
	  this.y = 362436069;
	  this.z = 521288629;
	  this.w = seed===undefined?Math.round(Math.random()*0x7fffffff):seed;
	}
	
	// XorShift
	next() {
	  let t;
	  t = this.x ^ (this.x << 11);
	  this.x = this.y; this.y = this.z; this.z = this.w;
	  return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8)); 
	}
	/**
	 * Uint31値を返す。
	 * 引数なし 0<=n<=UINT31
	 * 引数1 0<=n<a1
	 * 引数2 a1<=n<a2
	 */
	nextInt31(a1,a2)
	{
		let r=this.next() & 0x7fffffff;
		if(a1===undefined && a2==undefined){
			return r;
		}
		if(a2==undefined){
			return r % a1;
		}
		return (r % (a2 - a1))+ a1;
	}
	/**
	 * floatの値を返す。
	 * 引数なし 0<=n<=1
	 * 引数1 0<=<a1
	 */
	nextFloat(a1,a2){		
		if(a1===undefined && a2==undefined){
			return this.nextInt31()/0x7fffffff;
		}
		if(a2==undefined){
			return (this.nextInt31(0x7ffffffe)/0x7fffffff)*a1;
		}
		return (this.nextInt31(0x7ffffffe)/0x7fffffff)*(a2-a1)+a1;
	}
  }