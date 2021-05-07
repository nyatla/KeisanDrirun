import {Q,TaskQ,Wdt} from './nclasses';
/**
 * Speech Recogonition APIのハンドルクラス。
 * 連続認識に適した順序でイベントを再生成する。
 * 
 * start 認識APIの開始を開始したを示す。
 * stop 認識APIの終了を示す。
 * speech-start 音声の認識が開始したことを示す。
 * speech-end 音声の認識が完了したことを示す。
 * result speech-startからspeech-endの間で呼び出される認識結果を示す。
 * progress 音声の認識が進行したことを示す。
 * dead 非同期に修復不能な状態でAPIが停止した場合に呼び出される。
 * 
 * speech-endの直前に呼び出されたresultの内容がその音声入力の最終結果となる。
 * 
 * 呼び出し順序
 * start -> [speech-start -> progress -> *results -> speech-end] ->stop
 * 
 * + startが呼ばれた場合、必ずstopが呼び出される。
 * + stopが呼び出されるまでの間、speech-start -> speech-endが繰り返し呼ばれる。
 * + stop関数のタイミングによっては、speech-endは呼び出されないことがある。
 * + deadはどのタイミングでも呼び出されることがあり、その後インスタンスは使用不可能。
 */

export class SpeechHandler
{
    static hasAPI(){
        try{
            if(!window.SpeechRecognition && !webkitSpeechRecognition){
                return false;
            }
        }catch(e){
            return false;
        }
        return true;
    }
    _log(m,lv=0)
    {
        if(this._debugtool){
            this._debugtool.log(m,lv);
        }
    }
    _ASSERT(exp){
        if(this._debugtool){
            this._debugtool.ASSERT(exp,2);
        }
    }
    _createRecogonization(altanatives)
    {
        const _t=this;
        const SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
        const r=new SpeechRecognition();
        const q=this._q;
        r.lang = 'ja';
        r.interimResults = true;
        r.continuous = false;
        r.maxAlternatives = altanatives===undefined?1:altanatives;
        r.onaudiostart=function(event){
            q.push(["onaudiostart",event]);
        }
        r.onaudioend=function(event){
            q.push(["onaudioend",event]);
        }
        r.onsoundstart=function(event){
            q.push(["onsoundstart",event]);
        }
        r.onsoundend=function(event){
            q.push(["onsoundend",event]);
        }
        r.onspeechstart=function(event){
            q.push(["onspeechstart",event]);
        }
        r.onspeechend=function(event){
            q.push(["onspeechend",event]);
        }
        r.onerror=function(event){
            q.push(["onerror",event]);
        }
        r.onnomatch=function(event){
            q.push(["onnomatch",event]);
        }
        r.onresult=function(event){
            q.push(["onresult",event]);
        }
        return r;
    }
    

    /**
     * ボイスサービスを起動して、READYステータスに遷移します。
     */
    constructor(debugtool=undefined)
    {
        const _t=this;
        _t.TASK_STOP="TASK_START";
        _t.TASK_STOP="TASK_STOP";
        function Ast(f)
        {
            const q=new TaskQ();
            this.invokeEvent=function(m,p,n)
            {
                _t._log("_invokeEvent:"+" "+m,1);
                q.append(function(){
                    if(_t.onEvent){
                        _t.onEvent(m,p);
                    }
                },undefined,n);
                return this;
            }
            this.invoke=function(f,d,n){
                q.append(f,d,n);
                return this;
            }
            this.hasTask=function(n){
                return q.indexOf(n)>0;
            }
            this._q=q;
        }
        this._debugtool=debugtool;
        this._q=new Q();
        this._is_audioend_accepted=true;
        this._close_reason=null;
        this._onEvent=function(t,e){this.nullHandler(t,e);};
        this.as=new Ast();
    }

    /**
     * 非同期なリスタート関数。結果をcallbackに返す。
     * イベントキューにstoptaskがある場合は即座に失敗する。
     * function(reason)
     * reason: "pass","error","skip"
     */
    _asRestart(loop,callback)
    {
        var n=loop;
        const _t=this;
        _t._log("METHOD _restart-------------------------------");
        function safeStop(waitForStop)
        {	//
            _t.log("in safeStop");
            if(waitForStop)
            {	//stopAudioを待っていた場合
                _t._log("API stop");
                _t._recognition.stop();
                function proc()
                {
                    _t._q.asPop(function(item)
                    {
                        _t.log(type);
                        const type=item[0];
                        if(type=="onaudioend"){
                            _t.stop_request();
                            return;
                        }
                        proc();
                    });
                }
                proc();
            }else{
                //完了
                _t.stop_request();
            }
        }
        function restart()
        {
            const r=_t._recognition;
            if(n==0){
                callback("failed");
                return;
            }
            try{
                _t._log("call r.start "+n);
                n--;
                if(_t.as.hasTask(_t.TASK_STOP)){
                    safeStop(false);
                    return;
                }
                _t._log("API start");
                r.start();
                function task()
                {
                    // _t._dc=_t._dc?_t._dc+1:1;
                    // if(_t._dc>3){
                    //     callback("error");
                    // }
                    if(_t.as.hasTask(_t.TASK_STOP)){
                        safeStop(true);
                        return;
                    }						
                    _t._q.asPop(function(item){
                        const type=item[0];
                        const event=item[1];
                        _t._log("_asRestart:"+type+" "+event+" "+event.error);
                        switch(type){
                        case "onaudiostart":
                            callback("pass");
                            return;
                        case "onerror":
                            _t.dead_reason=event.error;
                            switch(event.error){
                            //case "aborted"://これONにすると奪い合いになる。
                            case "network":
                                _t._log("r.start recoverry:"+n+" "+event.error);
                                setTimeout(restart,1000);
                                return;
                            }
                            callback("error");
                            return;
                        default:
                            _t._log("drop event");
                            new Promise(function(c){c();}).then(task());
                            break;
                        }
                    });
                }
                task();
                return;
            }catch(e){
                _t._log("r.start failed:"+n+" "+e);
                setTimeout(restart,Math.round(Math.min(300+(loop-n)*100,1000)));
            }
        }
        restart();
    }
    start(altanatives)
    {
        const _t=this;
        _t._q.clear();
        const TASKNAME=_t.TASK_START;
        _t._log("METHOD start-------------------------------");
        _t.as.invoke(function(resolve){
            const r=_t._createRecogonization(altanatives);
            _t.as.invokeEvent("start");
            _t._recognition=r;
            _t._asRestart(1,function(reason){
                _t._log("/asRestart");
                switch(reason){
                case "pass":
                    //start中にstopが走って止まんなかった。
                    _t._ASSERT(!_t.started);
                    _t.started=true;
                    _t._listen();
                    _t.as.invokeEvent("speech-start");
                    break;
                case "error":
                case "failed":
                    _t._dead();
                    _t.as.invokeEvent("dead",_t.dead_reason);
                    break;
                case "stop":
                    _t._log("stop detected");
                    //ストップを検出したら素通り
                    break;
                }
                resolve();
            });
        }).invoke(function(){},undefined,TASKNAME);
    }
    stop()
    {
        const _t=this;
        const TASKNAME=_t.TASK_STOP;
        _t._log("METHOD stop-------------------------------");
        _t.as.invoke(function(resolve){
            _t._log(_t.started);
            if(_t.started)
            {	//開始している場合
                _t._log("API stop");
                _t._recognition.stop();					
                _t.stop_request=resolve;
            }else{
                resolve();
            }
        }).invoke(function()
        {
            _t.started=false;
            _t.stop_request=null;
            _t.as.invokeEvent("stop");
        },undefined,TASKNAME);
    }
    _dead(){
        const _t=this;
        _t._log("METHOD _dead-------------------------------");
        function loop(){
            if(_t._recognition){
                _t._recognition.stop();
                _t._recognition.stop();
            }
            _t._q.asPop(function(item){
                _t._log(item);
                loop();
            });
        }
        loop();
    }
    _listen()
    {
        
        class ResultWrapper{
            constructor(event){
                this.results=event.results;
            }
            //最終結果を持つか
            get isFinal(){
                var results=this.results;
                var fr=results[results.length-1];
                return fr.isFinal;
            }
            /**
             * 最終アイテムを返す.無い場合はnull
             */
            get last()
            {
                var results=this.results;
                var fr=results[results.length-1];
                if(fr.length==0 || !fr[0].transcript || fr[0].transcript==""){
                    return undefined;
                }
                return fr;
            }
            /**
             * [[text,confidence]...]の配列を返す。
             */
            makeRet()
            {
                var results=this.results;
                var fr=results[results.length-1];
                var ret=[];
                for(var j=0;j<fr.length;j++){
                    if(fr[j].transcript==""){
                        continue;
                    }
                    ret.push([fr[j].transcript,fr[j].confidence]);
                }
                return ret;
            }
        }

        const _t=this;
        _t._log("METHOD _listen-------------------------------");
        var r=_t._recognition;
        var accept_end=false;
        var close_reason=null;
        var wdt=null;
        function task()
        {
            _t._log("start TASK");
            function complete()
            {
                _t._log("complete reason:"+close_reason);
                const allowed_reason=["fix","nomatch","no-speech"];
                if(close_reason!==null  && allowed_reason.indexOf(close_reason)==-1){
                    _t.dead_reason=close_reason;
                    _t.as.invokeEvent("dead",_t.dead_reason);
                    return;
                }

                _t.as.invokeEvent("speech-end")
                .invoke(function(resolve){
                    _t._asRestart(10,function(reason){
                        _t._log("/asRestart");
                        switch(reason){
                        case "pass":
                            _t._listen();//再起動
                            _t.as.invokeEvent("speech-start");
                            break;
                        case "error":
                        case "failed":
                            _t._dead();
                            _t.as.invokeEvent("dead",_t.dead_reason);
                            break;
                        case "stop":
                            _t._log("stop in listen");
                            break;
                        }
                        resolve();
                    });
                });
                _t._log("/complete");
                _t._log(_t.as._q.length);
                return;
            }
            const ashandle=_t._q.asPop(function(item){
                const type=item[0];
                const event=item[1];
                _t._log("listenHandler:"+type+" "+event+" "+event.error);
                if(_t.stop_request)
                {	//stopリクエストがある場合は即時終了
                    _t.stop_request();
                    return;
                }
                switch(type){
                case "onspeechstart":
                    _t.as.invokeEvent("progress");
                    break;
                case "onaudioend":
                    accept_end=true;
                    if(close_reason){
                        //onaudioendが後着
                        complete();
                        return;
                    }else
                    {
                        //close_reason未着->WDT設定
                        wdt=new Wdt(1000,function(){
                            _t._log("force complete");
                            ashandle.cancel();//現在の非同期ハンドラを解除
                            if(_t.stop_request)
                            {	//stopリクエストがある場合は即時終了
                                _t.stop_request();
                                return;
                            }
                            complete();
                        });
                    }
                    break;
                case "onerror":
                    close_reason=event.error;
                    if(accept_end){
                        wdt.expire();
                        return;
                    }
                    break;
                case "nomatch":
                    close_reason="nomatch";
                    if(accept_end){
                        wdt.expire();
                        return;
                    }
                    break;
                case "onresult":
                    const ret=new ResultWrapper(event);
                    //ここでword通知イベント
                    _t.as.invokeEvent("progress");
                    if((!event.results) || !ret.last){
                    }else{
                        _t.as.invokeEvent("results",ret.makeRet());
                    }
                    if(ret.isFinal){
                        close_reason="fix";
                        _t._recognition.stop();
                        if(accept_end){
                            wdt.expire();
                            return;
                        }
                    }
                    break;
                default:
                    _t._log("drop event");
                    break;
                }
                new Promise(function(c){c();}).then(task);
            });
        }
        task();				
    }

}
