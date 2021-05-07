/**
 * UIレンダリングに関するクラス
 */


/**
 * 自動スケーリングクラスインスタンスを生成すると、フォントサイズの自動スケーリングを開始します。
 * サイズはhtmlの横幅を基準に計算します。
 */
export class AutoScale
{
    constructor(min=0,max=9999){
        function resizeAll()
        {
            var k=1024/20;
            const v=Math.max(min,Math.min(max,Math.floor($("html").width()/20)));
            $("html").css("font-size",v+"px");
        }
        var timer=false;
        $(window).on("resize",function(){
            if (timer !== false) {
                clearTimeout(timer);
            }
            timer = setTimeout(resizeAll,200);
        })
        resizeAll();
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