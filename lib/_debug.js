/**
 * 引数のチェック用。
 * InvalidArgumentException.Assert(条件)で使う
 */
export class InvalidArgumentException extends Error{
	static ASSERT(e,msg){
		if(!e){
			let m="Invalid argument"+msg?msg:"";
			if(m){console.error(m);}
			throw new InvalidArgument(m);
		}	
	}
	static CHECK(e,m){
		InvalidArgumentException.ASSERT(e,m);
	}
}
export class RuntimeError extends Error{
	static ASSERT(e,msg){
		if(!e){
			let m="Invalid argument"+msg?msg:"";
			if(m){console.error(m);}
			throw new RuntimeError(m);
		}	
	}
}

export class DebugTool
{
    SRC(n=0){
        try{
            throw new Error();
        }catch(e){
            return e.stack.split("\n")[2+n];
        }
    }
    log(v){
        var by=null;
        console.log(v);
    }
    ASSERT(exp,depth=1)
    {
        if(!exp){
            const s="ASSERT FAILED! "+this.SRC(depth);
            if(debug){
                alert(s);
            }
            this.log(s);
            throw new Error(s);
        }
    }
    EXCEPTION(m)
    {
        if(!m){
            m=SRC();
        }
        const s="EXCEPTION! "+m;
        alert(s);
        console.log(s);
        throw new Error(s);
    }    
}