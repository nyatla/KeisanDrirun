import {RuntimeError} from './_debug';


/**
 * sを回リピートした文字列を返す。
 * @param {*} s 
 * @param {*} n 
 * @returns 
 */
export function srepeat(s,n){
	var r="";
	for(var i=0;i<n;i++){
		r+=s;
	}
	return r;
}
/**
 * javascriptオブジェクトをHTMLフラグメントに変換します。
 * OBJ:=[tagname,({attr}),([OBJ,]|text)]|[[OBJ]]
 * 2,3番目のフラグメントは省略可能。
 * 2番目はタグの属性、3番目は子要素を示す。
 * 3番目の要素が配列の場合は
 * ex.
 * j2t(["div","p"]) - <div>a</div>
 * j2t(["div",["p","a"]]) - <div>pa</div>
 * j2t(["div",[["p","a"],]]) - <div><p>a</p></div>
 */
export function j2t(v,indent=0)
{
	function isHashArray(a){return (Object.prototype.toString.call(a) === '[object Object]');};
	function isArray(a){return Array.isArray(a);};
	function repeat(s,n){var r="";for(var i=0;i<n;i++){r+=s};return r};
	var rsp=repeat(" ",indent);
	function _o2t(v,depth){
		var pindent=(indent>0 && depth>0?"\n"+repeat(rsp,depth):"");
		var sindent=(indent>0?"\n"+repeat(rsp,depth):"");
		if(!isArray(v)){
			return pindent+v;
		}

		if(isArray(v[0]))
		{	//いきなり配列の場合は並列展開			
			s="";
			for(var i of v){
				s=s+_o2t(i,depth+1);
			}
			return s;
		}
		var attr=(v.length>1 && isHashArray(v[1]))?v[1]:null;
		var tags=(v.length==2 && isArray(v[1]))?v[1]:((v.length==3 && isArray(v[2]))?v[2]:null);
		var text=(v.length==2 && !isArray(v[1]))?v[1]:((v.length==3 && !isArray(v[2]))?v[2]:null);
		var s=pindent+"<"+v[0];
		if(attr){
			for(var i in attr){
				s+=" "+i+"=\""+attr[i]+"\"";
			}
		}
		if(tags){
			s+=">";
			for(var i of tags){
				s=s+_o2t(i,depth+1);
			}
			s+=sindent+"</"+v[0]+">";
		}else if(text){
			s+=">"+text+"</"+v[0]+">";

		}else{
			s+="></"+v[0]+">";
		}
		return s;
	}
	return _o2t(v,0);
}

/**
 * タグドキュメントとメソッドのラップクラス。継承して使います。
 * html関数にタグ表現jsonを記述して、bindオブジェクトのその階層のtagオブジェクトについての処理系を記述する。
 * renderメソッドでtag配下にオブジェクトをレンダリングする。
 * _tagメンバ変数はhtmlで返したスニペットをレンダリングしたjqueryオブジェクト。
 * 
 * @example
 * 
 * class Child extends TagCtrl
 * {
 * 	constructor(n){
 * 		super();
 * 		this.n=n;
 * 	}
 * 	get html(){
 * 		return j2t(["button","ぼったん#"+this.n]);
 * 	}
 * 	bind(tag){
 * 		super.bind(tag);
 * 		tag.children("button").on("click",()=>{alert(this.n);});
 * 	}
 * }
 * class Parent extends TagCtrl{
 * 	constructor(){
 * 		super();
 * 		this._c=[new Child(1),new Child(2)];
 * 	}
 * 	get html(){
 * 		return j2t(["ul",[["li",this._c[0].html],["li",this._c[1].html]]]);
 * 	}
 * 	bind(tag){
 * 		super.bind(tag);
 * 		let tags=tag.children("li");
 * 		for(var i=0;i<this._c.length;i++){
 * 			this._c[i].bind($(tags[i]));//children()[n]を使うときは$ラップを忘れずに
 * 		}
 * 	}
 * }
 * 	let pt=new Parent();
 *	pt.render($("#main"));
 */
 export class TagCtrl
 {
	constructor(){}
	get html(){}
	/**
	 * Jqueryタグオブジェクトをバインドする。
	 * @param {*} tag 
	 */
	bind(tag){
		this.tag=tag;
	}
	/**
	 * 
	 * @param {*} tag 
	 * 最上位のタグは単一であること。
	 */
	render(tag){
		tag.html(j2t(this.html));
		this.bind(tag);
	}
}