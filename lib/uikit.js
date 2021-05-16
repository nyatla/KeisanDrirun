/**
 * UIレンダリングに関するクラス
 */
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
		tag.html(this.html);
		this.bind(tag);
	}
}

/**
 * 自動スケーリングクラスインスタンスを生成すると、フォントサイズの自動スケーリングを開始します。
 * サイズはhtmlの横幅を基準に計算します。
 */
export class AutoScale
{
    constructor(k=20,min=0,max=9999){        
		const _t=this;
		function resizeAll()
        {
            // var k=1024/20;
            const v=Math.max(min,Math.min(max,Math.floor($("html").width()/k)));
			if(_t._onbefore){
				try{
					_t.onBefore()
				}catch(e){
					console.log("Exception in AutoScale:"+e);
				}
			}
            $("html").css("font-size",v+"px");
			_t._current_font_size=v;
			if(_t._onafter){
				try{
					_t.onAfter(v)
				}catch(e){
					console.log("Exception in AutoScale:"+e);
				}
			}
        }
        var timer=false;
        $(window).on("resize",function(){
            if (timer !== false) {
                clearTimeout(timer);
            }
            timer = setTimeout(resizeAll,200);
        });
		this._event=undefined;
        resizeAll();
    }
	onBefore(event){
		this._onbefore=event;
	}
	onAfter(event){
		this._onafter=event;
	}
}

/**
 * URLクエリのパーサー
 * 
 */

 export class QueryParser{
	constructor(url){
		let _url=new URL(url?url:window.location);
		this.spm=_url.searchParams;
	}
	/**
	 * keyがIntならその値のint値、そうでなければdefを返す。
	 */
	optInt(key,def){
		let sp=this.spm;
		if(sp.has(key) && /[0-9]+/.test(sp.get(key))){
			return parseInt(sp.get(key));
		}
		return def;
	}
	optStr(key,def){
		let sp=this.spm;
		if(sp.has(key)){
			return sp.get(key);
		}
		return def;
	}
	/**
	 * 文字列のインデクス番号を返す。
	 * @param {*} key 
	 * @param {[str]} choice
	 * @param {*} def 
	 */
	optChoice(key,choice,def){
		let sp=this.spm;
		if(sp.has(key)){
			return choice[key];
		}
		return def;
	}
}

export class TwitterLink{
	/**
	 * ツイッターリンクを生成する。
	 * @param {*} text 
	 * @param {*} hashtag 
	 * @param {*} url 
	 * @returns 
	 */
	static encodeMessage(text,hashtag,url)
	{
		var t="https://twitter.com/intent/tweet?text="+encodeURIComponent(text);
		if(hashtag){
			t+="&hashtags="+encodeURIComponent(hashtag);
		}
		if(url){
			t+="&url="+encodeURIComponent(url);
		}
		return t;
	}
	static messageWindow(text,hashtag,url){
		window.open().location.href = TwitterLink.encodeMessage(text,hashtag,url);
	}
}



export class DragdropHandler
{
    constructor(jtag)
    {
        const _t=this;
        function invokeonUrl(a,b){
            if(!_t.onUrl){
                return;
            }else{
                _t.onUrl(a,b);
            }
        }
        jtag.on('dragover',function(e){
            e.preventDefault();
        });
        jtag.on('dragleave',function(e){
            e.preventDefault();
        });
        jtag.on('drop', function(e){
            e.preventDefault();
            if(!_t._enable){
                console.log("disable drop!");
                return;
            }
            const dt=e.originalEvent.dataTransfer;
            //urlを取ってみる
            const url=dt.getData("url");
            if(url!=''){
                invokeonUrl(url,false);
                return;
            }
            //
            const files=dt.files;
            if(files.length!=1){
                return;
            }else{
                var reader = new FileReader();
                reader.readAsDataURL(files[0]);
                reader.onload = function() {
                    invokeonUrl(reader.result,true);
                };
            }
        });
        this.enable(true);
    }
    enable(f){
        this._enable=f;
    }
}