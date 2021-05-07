/**
 * マルチチャンネルサウンド再生クラス
 */
export class Se
{
    /**
     * 
     * @param {*} jparent 
     * audioタグを挿入するjqueryタグ
     * @param {*} src 
     * オーディオファイルのURL
     * @param {*} channels 
     * 多重再生のチャンネル数
     */
    constructor(jparent,src,channels=1)
    {		
        const setags=[];
        for(var i=0;i<channels;i++){
            jparent.append('<audio id="sound" preload="none" src="'+src+'" type="audio/mp3"></audio>');
            const a=jparent.children('audio:last-child')[0];
            a.load();
            setags.push(a);
        }
        this._tags=setags;
        this._channel=0;
    }
    play(){
        this._channel=(this._channel+1)%this._tags.length;
        const a=this._tags[this._channel];
        if(a.currentTime!=0){
            if(!a.ended){
                //終わってない場合は再生位置リセット
                a.currentTime=0;
                //_dbg.log("reset");
            }else{
                //終わってたら再生再開
                //_dbg.log("reboot");
                a.play();
            }
        }else{
            //_dbg.log("first");
            a.play();
        }
    }
    /** 全てのチャンネルのSEを停止 */
    stop()
    {
        for(var a of this._tags){
            if(!a.ended){
                a.pause();
                a.currentTime=0;
            }
        }
    }
}