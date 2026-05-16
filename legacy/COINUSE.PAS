{

        Coin 2000 Game (UNIT)
             Version 2.61
       Written by Song Jiuqing
        Copyright Song Studio
             1995-2000

}
{$N+}
unit CoinUse;

interface

uses
  Dos,
  CrtA,
  Graph,
  GraphDrv,
  GraphObj,
  GraphCon,
  GraphCrt,
  GraphDlg,
  GraphMnu;

const
  miu:double=0.015;
  g:double=9.8;

  kdCoin   = 0;
  kdStone  = 1;
  kdBomb   = 2;

  cmMouse  = $0201;
  cmTest   = $0202;

type
     TDie=set of 1..50;

     PCoin=^TCoin;
     TCoin=object(TObject)
       mg,sita,v,realx,realy:double;
       kind,number,radius,x,y:integer;
       enable:boolean;
       constructor init(t:integer);
       procedure use(a,b,r,c,am,k:integer);
       procedure draw;virtual;
       procedure die(needdraw:boolean);
       procedure hide;virtual;
       function go(needdraw:boolean):boolean;
       function hitother(var t:integer):Boolean;
       destructor done;virtual;
     end;

     PTable=^TTable;
     TTable=object(TGroup)
       constructor init(R:TRect;c:integer);
       procedure draw;virtual;
       procedure Controlmouse;virtual;
     end;

     PCoinLine=^TCoinLine;
     TCoinLine=object(TObject)
       drew:boolean;
       constructor init(p1,p2:TPoint);
       procedure drawat(p1,p2:TPoint);
       procedure DrawAt2(x1,y1,x2,y2:integer);
       procedure draw;virtual;
       procedure hide;virtual;
       procedure drawon;
     end;

     PLight=^TLight;
     TLight=object(TObject)
       procedure draw;virtual;
       procedure light(l:boolean);
     end;

     PBell=^TBell;
     TBell=object(TObject)
       freq,time:integer;
       cs,re:boolean;
       constructor init;
       procedure assign(f,t:integer;reduce,CanStop:boolean);
       procedure ring;
       procedure clear(SoundToEnd:Boolean);
     end;

type PCP=^TCP;
     TCP=object(TGroup)
       procedure draw;virtual;
     end;
type PValue=^TValue;
     TValue=object(TLabelX)
       function v:integer;
       procedure Change(va:integer);
       procedure add(va:integer);
     end;

var cp:PCP;
var
  c,coins:         array[1..50] of PCoin;
  CoinNumber,
  StoneNumber,BombNumber,
  ActiveCoin:    integer;
  mg1,mg2,mg3,color1,color2,color3,color4,color5,dcolor:integer;
  dnzf,r1,r2,r3,r4,r5,cm,gamev,totalcoin,maxv,cllong:integer;
  sjst,dyx,needgetposition,lsbp,bhbwz,save,randomput,sd,li,add,de:boolean;
  manfirst:byte;
  pm:PLabelX;
  table:         PTable;
  savename,player:string;
  die:TDie;
  ma1,ma2:integer;
  mlist1,mlist2,clist1,clist2:PValue;
  l1,l2:PLight;
  bell:PBell;
  savefile:text;
  comv:longint;


function Play1:integer;
procedure hit(c1,c2:integer;needdraw:boolean);
function getsita(x1,y1,x2,y2:double):double;
procedure about;
procedure setup;
procedure setalldefault;
procedure wait(t:integer);
procedure waitmouse(s:longint);
function OneOf(p:PStrLink):string;
function ReallyExit:Boolean;
procedure bomb(a,b:integer;needdraw:boolean);
implementation

function TValue.v;
begin
  if caption<>nil then v:=value(caption^) else v:=0;
end;

procedure TValue.Change;
begin
  changeto(stri(va));
end;

procedure TValue.Add;
begin
  changeto(stri(v+va));
end;


type
  p1=object(TDialogBox)
    procedure draw;virtual;
  end;

var
  t:longint;

procedure Font1;external;
{$L TSCR.OBJ}
procedure Font2;external;
{$L SIMP.OBJ}

procedure savedefault;
var CFGFile:text;
begin
  assign(CFGFile,'coin2000.cfg');
  rewrite(CFGFile);
  writeln(CFGFile,';Coin 2000 环境设置文件');
  writeln(CFGFile,';');
  writeln(CFGFile,';以下是各种质量参数, 取值范围都是5~10');
  writeln(CFGFile,'玩家硬币质量='+stri(mg1));
  writeln(CFGFile,'电脑硬币质量='+stri(mg2));
  writeln(CFGFile,'棋子质量='+stri(mg3));
  writeln(CFGFile,';');
  writeln(CFGFile,';以下是各种颜色参数, 颜色值所代表的意义如下:');
  writeln(CFGFile,';0-黑色 1-深蓝色 2-深绿色 3-深青色 4-深红色 5-深紫色 6-桔红色 7-灰色');
  writeln(CFGFile,';8-深灰色 9-蓝色 10-绿色 11-青色 12-红色 13-紫色 14-黄色 15-白色');
  writeln(CFGFile,'玩家硬币颜色='+stri(color1));
  writeln(CFGFile,'电脑硬币颜色='+stri(color2));
  writeln(CFGFile,'棋子颜色='+stri(color3));
  writeln(CFGFile,'炸弹颜色1='+stri(color4));
  writeln(CFGFile,'炸弹颜色2='+stri(color5));
  writeln(CFGFile,';');
  writeln(CFGFile,';以下是各种半径参数, 取值范围是11~15, 爆破半径为15~50');
  writeln(CFGFile,'玩家硬币半径='+stri(r1));
  writeln(CFGFile,'电脑硬币半径='+stri(r2));
  writeln(CFGFile,'棋子半径='+stri(r3));
  writeln(CFGFile,'炸弹半径='+stri(r4));
  writeln(CFGFile,'爆破半径='+stri(r5));
  writeln(CFGFile,';');
  writeln(CFGFile,';电脑布置方式有四种: 1-与玩家成中心对称');
  writeln(CFGFile,';                    2-与玩家成轴对称');
  writeln(CFGFile,';                    3-随机布置');
  writeln(CFGFile,';                    4-默认方式');
  writeln(CFGFile,'电脑布置方式='+stri(cm));
  writeln(CFGFile,';');
  writeln(CFGFile,';游戏难度的取值范围与电脑的速度有关, 电脑主频越快, 允许的难度越高');
  writeln(CFGFile,'游戏难度='+stri(gamev));
  writeln(CFGFile,';');
  writeln(CFGFile,';总硬币数的范围是10~100');
  writeln(CFGFile,'总硬币数='+stri(totalcoin));
  writeln(CFGFile,';');
  writeln(CFGFile,'桌面颜色='+stri(dcolor));
  writeln(CFGFile,';');
  writeln(CFGFile,';最大速度的范围是11~20');
  writeln(CFGFile,'最大速度='+stri(maxv));
  writeln(CFGFile,';');
  writeln(CFGFile,';轨迹线长度的范围是50~500');
  writeln(CFGFile,'轨迹线长度='+stri(cllong));
  writeln(CFGFile,';');
  writeln(CFGFile,';以下是是非型参数,1表示真,0表示假');
  writeln(CFGFile,'声音提示='+stri(ord(sd)));
  writeln(CFGFile,'轨迹线='+stri(ord(li)));
  writeln(CFGFile,'爆炸时拖延时间='+stri(ord(de)));
  writeln(CFGFile,'连锁爆破='+stri(ord(lsbp)));
  writeln(CFGFile,'打下棋子加分='+stri(ord(add)));
  writeln(CFGFile,'第一下禁止连弹='+stri(ord(dyx)));
  writeln(CFGFile,'随机试弹='+stri(ord(sjst)));
  writeln(CFGFile,';');
  writeln(CFGFile,';以下是习惯参数');
  writeln(CFGFile,'用户名='+player);
  writeln(CFGFile,'随机布置='+stri(ord(randomput)));
  writeln(CFGFile,'玩家先弹='+stri(manfirst));
  writeln(CFGFile,'每局硬币数='+stri(coinnumber));
  writeln(CFGFile,'每局棋子数='+stri(stonenumber));
  writeln(CFGFile,'每局炸弹数='+stri(bombnumber));
  writeln(CFGFile,'电脑主频='+stri(comv));
  writeln(CFGFile,'电脑作风='+stri(dnzf));
  close(CFGFile);
end;

function testv:longint;
var a,t1,t2,t3,t4,t5,t6,t7,t8:word;
    time1,time2:real;
    t:longint;
begin
  delay(10);
  gettime(t1,t2,t3,t4);
  time1:=t1*3600+t2*60+t3+t4*0.01;
  t:=0;
  repeat
    t:=t+1;
    gettime(t5,t6,t7,t8);
    time2:=t5*3600+t6*60+t7+t8*0.01;
  until time2-time1>= 0.1;
  testv:=t div 18;
end;

procedure loaddefault;
var CFGFile:text;
    l1,l2:string;
    v:integer;
begin
  assign(CFGFile,'Coin2000.CFG');
  {$I-}
  reset(CFGFile);
  {$I+}
  if IOResult=0 then begin
  while not eof(CFGFile) do begin
    readln(CFGFile,l1);
    if l1[1]=';' then continue;
    l2:=noblank(copy(l1,1,pos('=',l1)-1));
    v:=value(copy(l1,pos('=',l1)+1,length(l1)-pos('=',l1)));
    if l2='玩家硬币质量' then mg1:=validvalue(v,5,10) else
    if l2='电脑硬币质量' then mg2:=validvalue(v,5,10) else
    if l2='棋子质量' then mg3:=validvalue(v,5,100) else
    if l2='玩家硬币颜色' then color1:=validvalue(v,0,7) else
    if l2='电脑硬币颜色' then color2:=validvalue(v,0,7) else
    if l2='棋子颜色' then color3:=validvalue(v,8,15) else
    if l2='炸弹颜色1' then color4:=validvalue(v,0,7) else
    if l2='炸弹颜色2' then color5:=validvalue(v,8,15) else
    if l2='玩家硬币半径' then r1:=validvalue(v,11,15) else
    if l2='电脑硬币半径' then r2:=validvalue(v,11,15) else
    if l2='棋子半径' then r3:=validvalue(v,11,15) else
    if l2='炸弹半径' then r4:=validvalue(v,11,15) else
    if l2='爆破半径' then r5:=validvalue(v,15,100) else
    if l2='电脑布置方式' then cm:=validvalue(v,1,4) else
    if l2='游戏难度' then gamev:=validvalue(v,1,5) else
    if l2='声音提示' then sd:=(v=1) else
    if l2='轨迹线' then li:=(v=1) else
    if l2='爆炸时拖延时间' then de:=(v=1) else
    if l2='总硬币数' then totalcoin:=validvalue(v,10,100) else
    if l2='桌面颜色' then dcolor:=validvalue(v,0,15) else
    if l2='最大速度' then maxv:=validvalue(v,11,20) else
    if l2='打下棋子加分' then add:=(v=1) else
    if l2='轨迹线长度' then cllong:=validvalue(v,50,500) else
    if l2='用户名' then player:=copy(l1,pos('=',l1)+1,pos('=',l1)+20) else
    if l2='随机布置' then randomput:=(v=1) else
    if l2='玩家先弹' then manfirst:=validvalue(v,0,1) else
    if l2='每局硬币数' then coinnumber:=validvalue(v,1,10) else
    if l2='每局棋子数' then stonenumber:=validvalue(v,0,10) else
    if l2='每局炸弹数' then bombnumber:=validvalue(v,0,5) else
    if l2='不会被误炸' then bhbwz:=(v=1) else
    if l2='连锁爆破' then lsbp:=(v=1) else
    if l2='电脑作风' then dnzf:=validvalue(v,0,4) else
    if l2='第一下禁止连弹' then dyx:=(v=1) else
    if l2='随机试弹' then sjst:=(v=1) else
    if l2='电脑主频' then comv:=v;
  end;
  close(CFGFile);
  end;
end;

function computer:longint;
begin
  computer:=(comv-20)*(comv-20) div 35
end;

procedure setalldefault;
begin
  mg1:=5;
  mg2:=5;
  mg3:=8;
  color1:=3;
  color2:=1;
  color3:=13;
  color4:=0;
  color5:=15;
  r1:=11;
  r2:=11;
  r3:=15;
  r4:=12;
  r5:=15;
  cm:=3;
  gamev:=2;
  sd:=true;
  li:=true;
  de:=true;
  totalcoin:=30;
  dcolor:=2;
  maxv:=14;
  add:=true;
  cllong:=200;
  lsbp:=false;
  bhbwz:=false;
  randomput:=false;
  manfirst:=0;
  coinnumber:=4;
  stonenumber:=5;
  bombnumber:=0;
  player:='';
  comv:=testv;
  dnzf:=2;
  dyx:=true;
  sjst:=true;
  loaddefault;
end;

procedure TLight.draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  setcolor(8);arc(x,y,45,225,bouns.wide);
  setcolor(15);arc(x,y,225,45,bouns.wide);
  mshow;
  light(false);
end;

procedure TLight.light;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  if l then begin
    setcolor(color+8);
    setfillstyle(1,color+8);
    fillellipse(x,y,bouns.wide-1,bouns.wide-1);
  end else begin
    setcolor(color);
    setfillstyle(1,color);
    fillellipse(x,y,bouns.wide-1,bouns.wide-1);
  end;
  mshow;
end;

procedure wait;
var c:longint;
begin
  for c:=1 to computer*t do;
end;

type
  PSetupDialogBox=^TSetupDialogBox;
  TSetupDialogBox=object(TDialogBox)
    zp:PNumbox;
    procedure UserEvent(var event:TEvent);virtual;
  end;

procedure TSetupDialogBox.UserEvent;
begin
  inherited userevent(event);
  if (event.what=evCommand) then case event.command of
  cmMouse:mousedialog;
  cmTest:zp^.number^.changeto(stri(testv));
  end;
end;

procedure Setup;
var d:PSetupDialogBox;
    r:TRect;
    p:PPageGroup;
    p1,p2,p3,p4,p5,p6:PPage;
    B1,B2,B3,b4,b5,b6:PBox;
    m:array[1..16] of PNumBox;
    ct:array[1..14] of PColorTable;
    a:PChoice;
    s,s2,s3:PSlider;
    c1,c2,c3,c4,c5,c6,c7,c8,c9:PCheckBox;
    result:integer;
    input1:PInputBox;
begin
  r.assign(150,110,490,370,2);
  new(d,init(r,$7F,'$setup.ico$设置',false));
  r.assign(10,50,230,240,1);
  new(p,init(r,$70));
  d^.insert(p);
  new(p1,init($70,'玩家'));
  new(p2,init($70,'电脑'));
  new(p3,init($70,'棋子'));
  new(p5,init($70,'炸弹'));
  new(p4,init($70,'系统'));
  new(p6,init($70,'用户习惯'));
  p^.insertpage(p1);
  p^.insertpage(p2);
  p^.insertpage(p3);
  p^.insertpage(p5);
  p^.insertpage(p4);
  p^.insertpage(p6);
  r.assign(5,20,215,105,-charsize);
  new(b1,init(r,$70,'硬币外观'));
  p1^.insert(b1);
  b1^.insert(newlabel('颜色',$70,15,20));
  b1^.insert(newlabel('半径',$70,15,40));
  b1^.insert(newlabel('质量',$70,15,60));
  r.assign(55,20,105,32,1);
  new(ct[1],init(r,color1,[0..7]));
  b1^.insert(ct[1]);
  r.assign(55,40,105,52,1);
  new(m[2],init(r,$F0,11,15,r1,1));
  b1^.insert(m[2]);
  r.assign(55,60,105,72,1);
  new(m[3],init(r,$F0,5,10,mg1,1));
  b1^.insert(m[3]);
  r.assign(15,110,0,0,0);
  new(c2,init(r,'使用轨迹线(~L~)',kbAltL,li));
  p1^.insert(c2);
  p1^.insert(newlabel('轨迹线长度',$70,15,130));
  r.assign(15,150,185,170,0);
  new(s2,init(r,$77,50,500,cllong,nil));
  p1^.insert(s2);
  r.assign(5,20,110,105,-charsize);
  new(b2,init(r,$70,'硬币外观'));
  p2^.insert(b2);
  b2^.insert(newlabel('颜色',$70,15,20));
  b2^.insert(newlabel('半径',$70,15,40));
  b2^.insert(newlabel('质量',$70,15,60));
  r.assign(50,20,90,32,1);
  new(ct[4],init(r,color2,[0..7]));
  b2^.insert(ct[4]);
  r.assign(50,40,90,52,1);
  new(m[5],init(r,$F0,11,15,r2,1));
  b2^.insert(m[5]);
  r.assign(50,60,90,72,1);
  new(m[6],init(r,$F0,5,10,mg2,1));
  b2^.insert(m[6]);
  r.assign(105,20,215,105,-charsize);
  new(b3,init(r,$70,'布置方式'));
  p2^.insert(b3);
  r.assign(15,20,0,0,0);
  new(a,init(r,$70,cm,getstrlink(' 中心对称',
                     getstrlink(' 轴对称',
                     getstrlink(' 随机生成',
                     getstrlink(' 默认方式',nil))))));
  b3^.insert(a);
  r.assign(5,110,215,200,-charsize);
  new(b6,init(r,$70,'试弹参数设定'));
  p2^.insert(b6);
  b6^.insert(newlabel('试弹次数   少',$70,15,20));
  b6^.insert(newlabel('多',$70,180,20));
  b6^.insert(newlabel('电脑作风   守',$70,15,40));
  b6^.insert(newlabel('攻',$70,180,40));
  r.assign(110,20,170,34,0);
  new(s,init(r,$77,1,5,gamev,nil));
  b6^.insert(s);
  r.assign(110,40,170,54,0);
  new(s3,init(r,$77,0,4,dnzf,nil));
  b6^.insert(s3);
  r.assign(15,60,0,0,0);
  new(c4,init(r,'无最佳弹法则随机试弹(~R~)',kbAltR,sjst));
  b6^.insert(c4);
  r.assign(5,20,215,105,-charsize);
  new(b4,init(r,$70,'棋子外观'));
  p3^.insert(b4);
  b4^.insert(newlabel('颜色',$70,15,20));
  b4^.insert(newlabel('半径',$70,15,40));
  b4^.insert(newlabel('质量',$70,15,60));
  r.assign(55,20,105,32,1);
  new(ct[7],init(r,color3,[8..15]));
  b4^.insert(ct[7]);
  r.assign(55,40,105,51,1);
  new(m[8],init(r,$F0,11,15,r3,1));
  b4^.insert(m[8]);
  r.assign(55,60,105,72,1);
  new(m[9],init(r,$F0,5,10,mg3,1));
  b4^.insert(m[9]);
  r.assign(15,165,0,0,0);
  new(c3,init(r,'打下棋子加分(~A~)',kbAltA,add));
  p3^.insert(c3);
  r.assign(5,20,215,105,-charsize);
  new(b5,init(r,$70,'炸弹外观'));
  p5^.insert(b5);
  b5^.insert(newlabel('颜色1',$70,15,20));
  b5^.insert(newlabel('颜色2',$70,15,40));
  b5^.insert(newlabel('半径',$70,15,60));
  r.assign(55,20,105,32,1);
  new(ct[13],init(r,color4,[0..7]));
  b5^.insert(ct[13]);
  r.assign(55,40,105,51,1);
  new(ct[14],init(r,color5,[8..15]));
  b5^.insert(ct[14]);
  r.assign(55,60,105,72,1);
  new(m[15],init(r,$F0,11,15,r4,1));
  b5^.insert(m[15]);
  p5^.insert(newlabel('爆破半径',$70,10,120));
  r.assign(80,120,130,132,1);
  new(m[16],init(r,$F0,15,50,r5,5));
  p5^.insert(m[16]);
  r.assign(10,145,0,0,0);
  new(c5,init(r,'爆炸时拖延时间(~D~)',kbAltD,de));
  p5^.insert(c5);
  r.assign(10,170,0,0,0);
  new(c8,init(r,'连锁爆破(~L~)',kbAltL,lsbp));
  p5^.insert(c8);
  p4^.insert(newlabel('总硬币数',$70,15,40));
  r.assign(110,40,170,52,1);
  new(m[10],init(r,$F0,10,100,totalcoin,5));
  p4^.insert(m[10]);
  p4^.insert(newlabel('桌面颜色',$70,15,60));
  r.assign(110,60,170,72,1);
  new(ct[11],init(r,dcolor,[0..15]));
  p4^.insert(ct[11]);
  p4^.insert(newlabel('最大速度',$70,15,80));
  r.assign(110,80,170,92,0);
  new(m[12],init(r,$F0,11,20,maxv,1));
  p4^.insert(m[12]);
  r.assign(15,100,0,0,0);
  new(c1,init(r,'声音提示(~S~)',kbAltS,sd));
  p4^.insert(c1);
  r.assign(15,120,0,0,0);
  new(c9,init(r,'第一下禁止连弹(~P~)',kbAltP,dyx));
  p4^.insert(c9);
  r.assign(70,150,0,0,5);
  p4^.insert(new(PButton,init(r,' 调整鼠标(~M~) ',cmMouse,kbAltM,nil)));
  p6^.insert(newlabel('用户名:',$70,20,25));
  r.assign(70,25,150,37,2);
  new(input1,init(r,20,player,$F0,[28..255]));
  p6^.insert(input1);
  p6^.insert(newlabel('（按Alt-F2可输入中文）',$70,20,50));
  p6^.insert(newlabel('每局硬币数:',$70,20,75));
  r.assign(90,75,150,87,2);
  new(m[1],init(r,$F0,1,10,coinnumber,1));
  p6^.insert(m[1]);
  p6^.insert(newlabel('每局棋子数:',$70,20,100));
  r.assign(90,100,150,112,2);
  new(m[4],init(r,$F0,0,10,stonenumber,1));
  p6^.insert(m[4]);
  p6^.insert(newlabel('每局炸弹数:',$70,20,125));
  r.assign(90,125,150,137,2);
  new(m[7],init(r,$F0,0,5,bombnumber,1));
  p6^.insert(m[7]);
  r.assign(20,150,0,0,0);
  new(c6,init(r,'随机布置(~R~)',kbAltR,randomput));
  p6^.insert(c6);
  r.assign(120,150,0,0,0);
  new(c7,init(r,'玩家先弹(~P~)',kbAltP,manfirst>0));
  p6^.insert(c7);
  p6^.insert(newlabel('电脑主频',$70,20,175));
  r.assign(80,175,130,187,2);
  new(d^.zp,init(r,$F0,50,2000,comv,50));
  p6^.insert(d^.zp);
  r.assign(150,175,0,0,2);
  p6^.insert(new(PButton,init(r,' 测试(~T~) ',cmTest,kbAltT,nil)));
  d^.insert(newlabel('$COIN3.ICO$$coin4.ico$',$70,270,60));
  d^.insert(newlabel('$coin1.ico$$coin2.ico$',$70,270,44));
  r.assign(255,100,0,0,10);
  d^.insert(new(PButton,init(r,'  确  定  ',$FF00,kbEnter,nil)));
  r.assign(255,140,0,0,10);
  d^.insert(new(PButton,init(r,'  取  消  ',$FF01,kbESC,nil)));
  r.assign(255,180,0,0,10);
  d^.insert(new(PButton,init(r,'存为默认值',$FF03,kbNoKey,nil)));
  r.assign(255,220,0,0,10);
  d^.insert(new(PButton,init(r,'调用默认值',$FF02,kbNoKey,nil)));
  enablechineseinput;
  d^.execute;
  disablechineseinput;
  result:=d^.result;
  if result<>1 then begin
    mg1:=m[3]^.v;
    mg2:=m[6]^.v;
    mg3:=m[9]^.v;
    color1:=ct[1]^.GetColor;
    color2:=ct[4]^.GetColor;
    color3:=ct[7]^.GetColor;
    color4:=ct[13]^.GetColor;
    color5:=ct[14]^.GetColor;
    r1:=m[2]^.v;
    r2:=m[5]^.v;
    r3:=m[8]^.v;
    r4:=m[15]^.v;
    r5:=m[16]^.v;
    cm:=a^.selected;
    gamev:=s^.vx;
    sd:=c1^.enabled;
    li:=c2^.enabled;
    totalcoin:=m[10]^.v;
    dcolor:=ct[11]^.GetColor;
    maxv:=m[12]^.v;
    add:=c3^.enabled;
    de:=c5^.enabled;
    cllong:=s2^.vx;
    player:=input1^.gettext;
    randomput:=c6^.enabled;
    manfirst:=ord(c7^.enabled);
    lsbp:=c8^.enabled;
    coinnumber:=m[1]^.v;
    stonenumber:=m[4]^.v;
    bombnumber:=m[7]^.v;
    comv:=d^.zp^.v;
    dnzf:=s3^.vx;
    dyx:=c9^.enabled;
    sjst:=c4^.enabled;
    if result=2 then setalldefault;
    if result=3 then savedefault;
  end;
  dispose(d,done);
end;

procedure about;
var d:TDialogBox;
    r:TRect;
begin
  r.assign(190,130,450,265,2);
  d.init(r,$7F,'$coin2000.ico$关于',true);
  d.insert(new(PText,init('Coin',1,55,10,6,5,3,3)));
  d.insert(new(PText,init('2000',4,135,15,7,5,3,3)));
  d.insert(newlabel('$coin1.ico$$coin2.ico$',$70,20,30));
  d.insert(newlabel('$coin3.ico$$coin4.ico$',$70,20,46));
  d.insert(newlabel('Version 2.61 Build 1004',$70,61,65));
  d.insert(newlabel('作者：宋久擎',$70,94,90));
  d.insert(newlabel('2000年10月',$70,103,110));
  d.execute;
  d.done;
end;

constructor TCoinLine.init;
var r:TRect;
begin
  r.a:=p1;
  r.b:=p2;
  TObject.init(r,0);
  valid:=true;
  drew:=false;
end;

procedure TCoinLine.DrawAt;
begin
  if drew then hide;
  bouns.a:=p1;
  bouns.b:=p2;
  draw;
end;

procedure TCoinLine.DrawAt2;
var p1,p2:TPoint;
begin
  p1.x:=x1;
  p1.y:=y1;
  p2.x:=x2;
  p2.y:=y2;
  drawat(p1,p2);
end;

procedure TCoinLine.Drawon;
begin
  if not li then exit;
  setwritemode(Xorput);
  setcolor(2);
  mhide;
  with bouns do line(a.x,a.y,b.x,b.y);
  mshow;
  setwritemode(NormalPut);
end;

procedure TCoinLine.Hide;
begin
  if drew then drawon;
  drew:=false;
end;

procedure TCoinLine.draw;
begin
  if not drew then drawon;
  drew:=true;
end;

procedure p1.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,0,0,color div 16);
    drawline(x,y,x+80,y+b.y,0,4,4,4);
  end;
  drawline(x+30,y+115,x+350,y+132,1,15,8,3);
  drawline(x+190,y+175,x+330,y+222,0,3,3,3);
  drawline(x+264,y+179,x+326,y+217,0,8,15,3);
  drawline(x+194,y+179,x+256,y+217,0,8,15,3);
  np('作者: 宋久擎',x+271,y+118,8);
  np('作者: 宋久擎',x+270,y+117,15);
  mshow;
end;

function play1;
var d:p1;
    r:TRect;
begin
  finish:=false;
  r.assign(140,120,500,360,3);
  d.init(r,$FF,'Song Studio$reg.ico$系列产品',false);
  d.insert(new(PText,init('C',14,25,-10,6,9,6,8)));
  d.insert(new(PText,init('oin',9,81,-10,6,9,6,8)));
  d.insert(new(PText,init('2000',12,195,30,7,7,4,8)));
  r.assign(205,190,0,0,10);
  d.insert(new(PButton,init(r,'$enter.ico$开始',$FF01,kbEnter,nil)));
  r.assign(277,192,0,0,12);
  d.insert(new(PButton,init(r,'放录相',$FF04,kbAltP,nil)));
  r.assign(15,150,0,0,3);
  d.insert(new(PToolButton,init(r,$4F,' $quit.ico$结束 ','',$FF00,nil)));
  r.assign(15,180,0,0,3);
  d.insert(new(PToolButton,init(r,$4F,' $setup.ico$设置 ','',$FF02,nil)));
  r.assign(15,210,0,0,3);
  d.insert(new(PToolButton,init(r,$4F,' $coin2000.ico$关于 ','',$FF03,nil)));
  d.insert(newlabel('本游戏完全免费，欢迎拷贝。 2000年10月 V2.61',$F0,100,228));
  d.insert(new(PHotKey,init($FF00,kbAltQ)));
  d.insert(new(PHotKey,init($FF00,kbESC)));
  d.execute;
  play1:=d.result;
  d.done;
end;

{ TCoin }

constructor TCoin.init;
var re:TRect;
begin
  re.assign(0,0,0,0,0);
  TObject.init(re,0);
  mg:=0;
  sita:=0;
  v:=0;
  realx:=0;
  realy:=0;
  number:=t;
  radius:=0;
  x:=0;
  y:=0;
  kind:=kdCoin;
  enable:=false;
end;

procedure TCoin.use;
begin
  if enable then hide;
  mg:=am;
  realx:=a;
  realy:=b;
  x:=a;
  y:=b;
  color:=c;
  kind:=k;
  enable:=true;
  if mg<=0 then mg:=5;
  radius:=r;
end;

procedure TCoin.hide;
var a,b:integer;
begin
  mhide;
  getxy(a,b);
  setcolor(dcolor);
  setfillstyle(1,dColor);
  fillellipse(x+a,y+b,radius,radius);
  mshow;
end;

function TCoin.go;
var tx,ty:double;
    t:integer;
begin
  if (v<=0) then begin
   if needdraw then wait(2);
   exit;
  end;
  go:=true;
  if needdraw then hide;
  tx:=realx;
  ty:=realy;
  realx:=realx+v*cos(sita);
  realy:=realy+v*sin(sita);
  if hitother(t) then begin
    realx:=tx;
    realy:=ty;
    hit(number,t,needdraw);
    if needdraw then draw;
    if t>40 then go:=false;
  end else if ((realx<radius)or(realx>table^.bouns.b.x-radius))and(realy>radius)and(realy<table^.bouns.b.y-radius)then begin
    sita:=pi-sita;
    realx:=tx;
    realy:=ty;
    if needdraw then draw;
    if needdraw then bell^.assign(600,5,false,true)
  end else if (realy<radius) or (realy>table^.bouns.b.y-radius) then begin
    die(needdraw);
    go:=false;
  end else begin
    x:=trunc(realx);
    y:=trunc(realy);
    if sqr(v)-2*miu*g*v>0 then v:=sqrt(sqr(v)-2*miu*g*v) else v:=0;
    wait(2);
    if needdraw then draw;
  end;
end;

procedure TCoin.die;
var t:longint;
begin
  v:=0;
  sita:=0;
  enable:=false;
  if coins[activecoin]=@self then activecoin:=0;
  if needdraw then bell^.assign(800,15,false,false);
end;

function TCoin.hitother;
var tt:integer;
begin
  hitother:=false;
  t:=0;
  for tt:=1 to 50 do
    if coins[tt]^.enable and (coins[tt]<>@self) then
      if sqr(realx-coins[tt]^.realx)+sqr(realy-coins[tt]^.realy)<=sqr(radius+coins[tt]^.radius+2) then begin
        hitother:=true;
        t:=tt;
        exit;
      end;
end;

destructor TCoin.Done;
begin
  inherited done;
end;

procedure TCoin.Draw;
var a,b:integer;
begin
  if not enable then exit;
  mhide;
  getxy(a,b);
  case kind of
  kdCoin:begin
    if activecoin=number then begin
      setcolor(color+8);
      setfillstyle(1,color+8);
      fillellipse(x+a,y+b,radius,radius);
    end else begin
      setcolor(color);
      setfillstyle(1,color);
      fillellipse(x+a,y+b,radius,radius);
    end;
    setcolor(8);arc(x+a,y+b,45,225,radius-2);
    setcolor(15);arc(x+a,y+b,225,45,radius-2);
    drawline(x+a-1,y+b-5,x+a+1,y+b,0,15,8,-1);
  end;
  kdStone:begin
    setcolor(color);
    setfillstyle(1,color);
    fillellipse(x+a,y+b,radius,radius);
  end;
  kdBomb:begin
    setcolor(color mod 16);
    setfillstyle(1,color mod 16);
    fillellipse(x+a,y+b,radius,radius);
    setfillstyle(1,color div 16);
    fillellipse(x+a,y+b,radius div 2,radius div 2);
  end;
  end;
  setcolor(15);arc(x+a,y+b,45,225,radius);
  setcolor(8);arc(x+a,y+b,225,45,radius);
  mshow;
end;

constructor TTable.init;
begin
  TGroup.init(R,c);
end;

procedure TTable.Draw;
const
  Gray50 : FillPatternType = ($AA, $55, $AA,
    $55, $AA, $55, $AA, $55);
begin
  mhide;
  with bouns do begin
    drawline(a.x-2,a.y,a.x+b.x+2,a.y+b.y,5,15,8,-1);
    drawline(a.x-2,a.y,a.x+b.x+2,a.y+b.y,2,8,15,color div 16);
  end;
  setfillpattern(Gray50,7);
  setcolor(3);
  with bouns do begin
    bar(a.x-2,a.y,a.x-1,a.y+b.y);
    bar(a.x+b.x+2,a.y,a.x+b.x,a.y+b.y);
  end;
  setfillstyle(1,0);
  mshow;
end;

procedure TTable.ControlMouse;
var r:registers;
    x,y:integer;
begin
  getxy(x,y);
  r.ax:=7;
  r.cx:=x+16;
  r.dx:=x+bouns.b.x div 2-17;
  intr($33,r);
  r.ax:=8;
  r.cx:=y+15;
  r.dx:=y+bouns.b.y-15;
  intr($33,r);
end;

function getsita(x1,y1,x2,y2:double):double;
begin
  if (y2>y1) and (x2>x1) then getsita:=arctan((y2-y1)/(x2-x1));
  if (y2>y1) and (x2<x1) then getsita:=arctan((y2-y1)/(x2-x1))+pi;
  if (y2<y1) and (x2<x1) then getsita:=arctan((y2-y1)/(x2-x1))+pi;
  if (y2<y1) and (x2>x1) then getsita:=arctan((y2-y1)/(x2-x1));
  if (y2=y1) and (x2>x1) then getsita:=0;
  if (y2=y1) and (x2<x1) then getsita:=pi;
  if (y2=y1) and (x2=x1) then getsita:=0;
  if (y2>y1) and (x2=x1) then getsita:=pi/2;
  if (y2<y1) and (x2=x1) then getsita:=-pi/2;
end;

procedure hit;
var m1,m2,s,vx1,vy1,vx1p,vx2,vy2,vx2p:double;
    e:TEvent;
begin
  if needdraw then bell^.assign(1000,5,true,true);
  if c2<=40 then begin
    m1:=coins[c1]^.mg;
    m2:=coins[c2]^.mg;
    s:=getsita(coins[c1]^.realx,coins[c1]^.realy,coins[c2]^.realx,coins[c2]^.realy);
    vx1p:=coins[c1]^.v*cos(coins[c1]^.sita-s);
    vy1 :=coins[c1]^.v*sin(coins[c1]^.sita-s);
    vx2p:=coins[c2]^.v*cos(coins[c2]^.sita-s);
    vy2 :=coins[c2]^.v*sin(coins[c2]^.sita-s);
    vx1 :=((m1-m2)*vx1p+2*m2*vx2p)/(m1+m2)*0.95;
    vx2 :=((m2-m1)*vx2p+2*m1*vx1p)/(m1+m2)*0.95;
    coins[c1]^.v:=sqrt(sqr(vx1)+sqr(vy1));
    coins[c2]^.v:=sqrt(sqr(vx2)+sqr(vy2));
    coins[c1]^.sita:=s+getsita(0,0,vx1,vy1);
    coins[c2]^.sita:=s+getsita(0,0,vx2,vy2);
  end else bomb(c1,c2,needdraw);
end;

procedure WaitMouse;
var a,b,c,d:word;
    w,t:longint;
    e:TEvent;
    p:TPoint;
begin
  gettime(a,b,c,d);
  t:=a*360000+b*6000+c*100+d;
  getmouseevent(e);
  p:=e.where;
  if s<=0 then s:=10000000;
  repeat
    getmouseevent(e);
    gettime(a,b,c,d);
    w:=a*360000+b*6000+c*100+d;
    if w-t<0 then w:=w+24*360000;
  until (w>=t+s*100) or (e.where.x<>p.x) or (e.where.y<>p.y) or (e.what=evMouse);
end;

function OneOf;
var q:PStrlink;
    t,n:integer;
begin
  q:=p;
  n:=0;
  if q=nil then oneof:='' else repeat
    n:=n+1;
    q:=q^.next;
  until q=nil;
  t:=random(n)+1;
  q:=p;
  for n:=1 to t-1 do q:=q^.next;
  if q^.data<>nil then oneof:=q^.data^ else oneof:='';
  disposestrlink(p);
end;

function ReallyExit;
begin
  reallyexit:=(messagebox('真的不想玩了？','结束',2)=1)
end;

procedure bomb;
var m,n,t,c:integer;
    notdie:set of 1..10;
begin
  coins[b]^.getxy(m,n);
  mhide;
  if needdraw then coins[b]^.hide;
  coins[b]^.radius:=r5;
  if needdraw then bell^.assign(1000,30,true,false);
  setwritemode(Xorput);
  if needdraw then with coins[b]^ do for c:=1 to 2 do for t:=1 to 360 do begin
    line(x+m,y+n,trunc(x+m+r5*cos(t*pi/180)),trunc(y+n+r5*sin(t*pi/180)));
    if de then wait(5);
  end;
  setwritemode(normalput);
  coins[b]^.die(needdraw);
  notdie:=[];
  while(coins[b]^.hitother(c)) or coins[a]^.enable do begin
    if (c in [1..10]) and bhbwz and (c<>a) then begin
      coins[c]^.enable:=false;
      notdie:=notdie+[c];
      continue;
    end;
    if coins[a]^.enable then c:=a;
    if needdraw then for t:=1 to coins[c]^.radius do with coins[c]^ do begin
      setcolor(4);
      setfillstyle(1,4);
      fillellipse(x+m,y+n,t,t);
      if de then wait(100);
    end;
    if (coins[c]^.kind=kdBomb) and lsbp then bomb(b,c,needdraw) else begin
      coins[c]^.die(needdraw);
      if needdraw then coins[c]^.hide;
      die:=die+[c];
    end;
  end;
  for t:=1 to 10 do if t in notdie then coins[t]^.enable:=true;
  mshow;
end;

constructor TBell.init;
var r:TRect;
begin
  r.assign(0,0,0,0,0);
  TObject.init(r,0);
  freq:=0;
  time:=0;
  cs:=false;
  re:=false;
end;

procedure TBell.assign;
begin
  if cs or (time=0)then begin
    freq:=f;
    time:=t;
    cs:=canstop;
    re:=reduce;
  end;
end;

procedure TBell.ring;
begin
  if time=0 then nosound else if sd then begin
    sound(freq);
    if re then freq:=freq-10;
    time:=time-1;
  end else time:=0;
end;

procedure TBell.Clear;
begin
  if soundtoend then repeat
    ring;
    wait(100);
  until time<=0;
  time:=0;
  freq:=0;
  nosound;
end;

procedure TCP.draw;
begin
  mhide;
  drawline(7,430,633,475,3,15,8,3);
  mshow;
  drawsub;
end;

begin
  RegisterBGIfont(@Font1);
  RegisterBGIfont(@Font2);
  randomize;
  for t:=1 to 50 do coins[t]:=new(PCoin,init(t));
  for t:=1 to 50 do c[t]:=new(PCoin,init(t));
  player:='';
end.
