

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}



/**
 * 関数登録して使うタスクキュー。
 * 関数またはPromiseを登録順に実行する。
 */
export class TaskQ
{
    constructor(){
        this.q=[];
    }
    _kick(q)
    {
        const _t=this;
        if(q.length!=1){
            return;
        }		
        function createPromise_(){
            if(q.length==0){
                return;
            }
            const task=q[0];
            q.shift();
//				console.log("cpA:"+task[2]);

            return new Promise(function(callback){
                if(task[1]){
                    setTimeout(function(){callback();},task[1]);
                }else{
                    callback();
                }
            }).then(function(){
//					console.log(task);
                if(task[0].prototype.constructor.length){
                    new Promise(task[0]).then(createPromise_);
                }else{
                    task[0]();
//					console.log("cpB:"+task[2]);
                    createPromise_();
                }
            });
        }
        new Promise(function(c){c();}).then(function(){
            createPromise_();
        });	
    }
    
    /**
     * 現在実行中のキューの直後にタスクを置く.
     * 置いたタスクは現在のタスクが終了した直後に実行される。
     * タスク内で割り込むときに使える。
     * fの引数が0なら関数、1ならpromisecallbackとして実行します。
     */
    insert(f,delay,name){
//			console.log("insert");
        this.q.unshift([f,delay,name]);
//			console.log(this.q[this.q.length-1]);
        this._kick(this.q);
        return this;
    }
    /**
     * タスクキューの後端にタスクを置く
     * 配置したタスクは最後に実行される。
     * fの引数が0なら関数、1ならpromisecallbackとして実行します。
     */
    append(f,delay,name)
    {
//			console.log("append");
        const _t=this;
        this.q.push([f,delay,name]);
//			console.log(this.q[this.q.length-1]);
        this._kick(this.q);		
        return this;
    }
    /**
     * 名前でタスクを検索する。
     */
    indexOf(name,s=0){
        for(var i=s;i<this.q.length;i++){
            if(name==this.q[i][2]){
                return i;
            }
        }
        return -1;
    }
    /**
     * タスクキューの長さ
     */
    get length(){
        return this.q.length;
    }
}
/**
 * FIFOキュー
 */
export class Q
{
    constructor(){
        this.q=[];
        this.cq=[];
    }
    /**
     * キューの後端にアイテムを置く。
     */
    push(d)
    {
        if(this.cq.length>0){
            const target=this.cq[0];
            this.cq.shift();
            if(target.tid){
                clearTimeout(target.tid);
            }
            target.callback(d);//関数コール
        }else{
            this.q.push(d);
            return this;
        }
    }
    get length(){
        return this.q.length;
    }
    isEmpty(){
        return this.q.length==0;
    }
    /**
     * キューの先端をpopして返す。
     * 存在しなければundefined
     */
    pop()
    {
        if(this.isEmpty()){
            throw new Error("EmptyQ");
        }
        const d=this.q[0];
        this.q.shift();
        return d;
    }
    /**
     * キューの先端の到達を非同期に待機する。
     * タイムアウトした場合はundefinedをコールバックする。
     * @return
     * 待機アイテムを制御するハンドルを返します。#cancel関数で待機をキャンセルできる。
     * キャンセルすると関数は呼ばれない。
     */
    asPop(callback,timeout)
    {
        const _t=this;
        //cpから要らないtidを削除する。
        function removeFrockByTid(tid){
            var n=[];
            for(var i of _t.cq){
                if(i.tid===tid){
                    continue;
                }
                n.push(i);
            }
            _t.cq=n;
        }
        class PopHandle{
            constructor(callback,tid)
            {
                this.callback=callback;
                this.tid=tid;

            }
            /**非同期な待機をキャンセルする。
             * キャンセルした待機は実行されない。
             */
            cancel(){
                removeFrockByTid(tid);
                if(this.tid){
                    clearTimeout(this.tid);//タイムアウトを解除
                }
            }
        }
        if(this.q.length>0){
            callback(this.pop());
            return new PopHandle(callback,undefined);
        }
        var tid=undefined;
        if(timeout){
            tid=setTimeout(function(){
                //tidに合致する項目を削除
                removeFrockByTid(tid);
                callback(undefined);
            },timeout);
        }
        const pi=new PopHandle(callback,tid);
        this.cq.push(pi);
        return pi;
    }
    /**
     * キューをクリアする。
     */
    clear(){
        this.q=[];
    }
}


/**
 * ウォッチドックタイマ。
 */
export class Wdt
{
    constructor(term,callback){
        const _t=this;
        _t._tid=null;
        new Promise(function(c){
            _t._tid=setTimeout(c,term);
            _t.success=c;
        }).then(function(){
            _t._tid=null;
            callback();
        });
    }
    expire(){
        if(this.cancel()){
            this.success();
        }
    }
    cancel(){
        if(this._tid){
            clearTimeout(this._tid);
            this._tid=null;
            return true;
        }
        return false;
    }
}


/**
 * LocalStorageのヘルパークラス
 */
 export class LocalStrageIo
 {
     /**
      * 与えた引数にあるキー全てが存在するかを返す。
      */
     has(...theArgs){
         for(var i of theArgs){
             if(!this.get(i)){
                 return false;
             }
         }
         return true;
     }
     put(k,v){
         localStorage.setItem(k,v);
         return this;
     }
     putDate(k,v){
         const s=v.getTime();
         localStorage.setItem(k,s);
         return this;
     }
     putJSON(k,v){
         console.log(v);
         this.put(k,JsPickle.dumps(v));
         return this;
     }
     get(k){
         const v=localStorage.getItem(k);
         return v;
     }
     getDate(k){
         const v=localStorage.getItem(k);
         if(!v){
             return undefined;
         }
         const r=new Date();
         r.setTime(v);
         return r;
     }
     getJSON(k){
         return JsPickle.loads(this.get(k));
     }
     getInt(k){
         return parseInt(this.get(k));
     }
     addNumber(k,v=1){
         const r=this.getInt(k)+v;
         this.put(k,r);
         return r;
     }
     clear(){
         localStorage.clear();
     }
 }


 
export class JsPickle{
	static loads(s){
		return JsPickle.unpickle(JSON.parse(s));
	}
	static dumps(j){
		return JSON.stringify(JsPickle.pickle(j));
	}
	static pickle(v){
		switch(typeof(v)){
		case "string":
		case "number":
			return v;
		}
		//配列
		if(isArray(v)){
			const d=[];
			for(const i of v){
				d.push(JsPickle.pickle(i));
			}
			return d;
		}
		//Dateオブジェクト
		if(v instanceof Date){
			return {__cls:"Date",d:v.getTime()};
		}
		//一般オブジェクト
		const d={};
		for(const i in v){
			d[i]=JsPickle.pickle(v[i]);
		}
		return d;
	}
	static unpickle(v){
		switch(typeof(v))
		{
		case "string":
		case "number":
			return v;
		}
		//配列
		if(isArray(v)){
			const a=[];
			for(var i of v){
				a.push(JsPickle.unpickle(i));
			}
			return a;
		}
		if("__cls" in v && "d" in v){
			switch(v["__cls"]){
			case "Date":
				return new Date(v["d"]);
			}
		}
		const d={};
		for(const i in v){
			d[i]=JsPickle.unpickle(v[i]);
		}
		return d;		
	}
}
