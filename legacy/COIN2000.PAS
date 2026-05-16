{

           Coin 2000 Game
             Version 2.61
       Written by Song Jiuqing
        Copyright Song Studio
             1995-2000

}
{$N+}

program
  Coin2000;

uses
  CoinUse,
  GraphApp,
  GraphDrv,
  GraphDlg,
  GraphObj,
  GraphCon,
  CrtA,
  Graph,
  GraphCrt,
  DOS,
  GraphMnu;

type
  TM=object(TGraphApp)
       procedure setdefault;virtual;
       procedure run;virtual;
       procedure getcoinposition;
       procedure getcoinmessage(n:integer);
       procedure getv;
       procedure cgetv;
       procedure InitControlPan;
       procedure PlayFile;
       procedure helpme;
     end;

var
  app:tm;
  vlist:PProgressBar;
  cl:TCoinLine;
procedure tm.setdefault;
begin
  inherited setdefault;
  desktopcolor:=$30;
  littlechar:=true;
  icgname:='coin2000.icg';
  enablemousekey:=true;
end;

procedure doit(r:integer);
var stop:boolean;
    ma,t:integer;
begin
  die:=[];
  ma:=10;
  ma1:=0;
  ma2:=0;
  if save then begin
    for t:=1 to 40 do if coins[t]^.enable and (coins[t]^.v>0) then break;
    writeln(savefile,r,' ',t,' ',coins[t]^.v,' ',coins[t]^.sita);
  end;
  repeat
    stop:=true;
    for t:=1 to 40 do if coins[t]^.enable then if not coins[t]^.go(true) then begin
      die:=die+[t];
      if t<=20 then begin
        if r=1 then ma1:=ma1+ma else ma2:=ma2+ma;
        ma:=ma+5;
      end else if add then if r=1 then ma1:=ma1+5 else ma2:=ma2+5;
    end;
    bell^.ring;
    for t:=1 to 40 do if coins[t]^.enable and (coins[t]^.v<>0) then stop:=false;
  until stop;
  vlist^.go_to(0);
  mlist1^.add(ma1);
  mlist2^.add(ma2);
  bell^.clear(true);
end;

  function PositionWell:boolean;
  var t,tt:integer;
  begin
    PositionWell:=true;
    for t:=1 to 50  do if coins[t]^.enable and coins[t]^.hitother(tt) then begin
      if not randomput then messagebox('因为您设置电脑的硬币半径比您的硬币半径大，或已设硬币半径比载入文件中指定的硬币半径大'+
        '，所以按您现在这种布局方式，会有一些硬币或棋子相互重叠。请加大硬币与硬币、硬币与棋子间的距离。','$stop.ico$警告',1);
      PositionWell:=false;
      break;
    end;
  end;

procedure TryToSave;
var t:integer;
begin
  assign(savefile,savename);
  {$I-}
  rewrite(savefile);
  {$I+}
  if ioresult>0 then begin
    messagebox('试图打开录相文件 '+savename+' 时发生错误, 录相保存失败. ','错误',1);
    save:=false;
  end else begin
    writeln(savefile,'Coin2000 Save File');
    enablechineseinput;
    player:=inputbox('请输入您的大名(按Alt-F2输入中文)','名字',player,20,[28..255]);
    writeln(savefile,player);
    disablechineseinput;
    cp^.drawall;
    writeln(savefile,mg1,' ',mg2,' ',mg3,' ',color1,' ',color2,' ',color3,' ',color4,' ',color5,' ',
    dcolor,' ',r1,' ',r2,' ',r3,' ',r4,' ',r5,' ',cm,' ',gamev,' ',coinnumber,' ',stonenumber,' ',bombnumber);
    writeln(savefile,ord(lsbp),' ',ord(bhbwz));
    for t:=1 to 50 do if coins[t]^.enable then
      writeln(savefile,coins[t]^.x,' ',coins[t]^.y)
    else
      writeln(savefile,'0 0');
  end;
end;

procedure tm.run;
var event:TEvent;
    t,n,la1,la2,c1,c2:integer;
    first,stop,stop1,stop2,people:boolean;
    r:TRect;
    p:TPoint;
label a1;
begin
  disablechineseinput;
  p.x:=0;
  p.y:=0;
  cl.init(p,p);
  SetAllDefault;
  ma1:=0;
  ma2:=0;
  n:=1;
  initcontrolpan;
  r.assign(10,10,630,420,7);
  table:=new(PTable,init(r,dcolor*16));
  desktop^.insert(table);
  table^.draw;
  for t:=1 to 50 do table^.insert(coins[t]);
  for t:=1 to 50 do table^.insert(c[t]);
  repeat
    case play1 of
    0:break;
    1:begin
        table^.color:=dcolor*16;
        table^.draw;
        l1^.color:=color1;
        l2^.color:=color2;
        mlist1^.change(0);
        mlist2^.change(0);
        clist1^.change(totalcoin);
        clist2^.change(totalcoin);
        ma1:=0;
        ma2:=0;
        n:=1;
        repeat
          for t:=1 to 50 do coins[t]^.die(false);
          table^.draw;
          GetCoinMessage(n);
          if finish then break;
          if needgetposition then GetCoinPosition;
          if save then TryToSave;
          stop1:=false;
          stop2:=false;
          first:=dyx;
          repeat
            if manfirst=1 then goto a1;
            repeat
              stop1:=true;
              stop2:=true;
              people:=false;
              cgetv;
              doit(2);
              for t:=11 to 20 do if coins[t]^.enable then stop1:=false;
              for t:=1 to 10 do if coins[t]^.enable then stop2:=false;
              if die*[1..10]=[] then pm^.changeto(oneof(
                getstrlink('这只不过是要试试你的神经弹性。',
                getstrlink('我觉得，咱们同学就应该具有这种心理“素质”。',
                getstrlink('这也就是逗愣逗愣你。',nil)))))
              else pm^.changeto(oneof(
                getstrlink('你，又上当了！',
                getstrlink('你一定要明白我的意图。',
                getstrlink('我的钢板，它就是一个好圆！',
                getstrlink('我弹的这一下，有特色！',nil))))));
              waitmouse(2);
            until (die*[1..10]=[]) or (die*[11..20]<>[]) or stop1 or stop2 or first;
            first:=false;
a1:         if manfirst=1 then manfirst:=2;
            if not (stop1 or stop2) then begin
              repeat
                stop1:=true;
                stop2:=true;
                people:=true;
                GetV;
                pm^.changeto(oneof(
                  getstrlink('和谁碰撞，你的观点呢？',
                  getstrlink('千万不能想当然！',
                  getstrlink('一定要老老实实地，受力分析！',nil)))));
                doit(1);
                for t:=1 to 10 do if coins[t]^.enable then stop1:=false;
                for t:=11 to 20 do if coins[t]^.enable then stop2:=false;
                if die*[1..10]<>[] then pm^.changeto(oneof(
                  getstrlink('你受力分析了吗？',
                  getstrlink('简直就像“瞎驴撞槽”一样！',
                  getstrlink('明天把改错交上来',nil)))))
                else if die*[11..20]=[] then pm^.changeto(oneof(
                  getstrlink('你，喝了！',
                  getstrlink('你的观点，错！',
                  getstrlink('又想当然了',
                  getstrlink('早觉悟，晚觉悟，早晚得觉悟。',
                  getstrlink('你不如用柯西不等式试试哦！',
                  getstrlink('绕圈圈，圈圈绕',nil))))))))
                else pm^.changeto(oneof(
                  getstrlink('告诉你，你的观点，完全正确！',
                  getstrlink('唉，太好了，我就等你这么弹了。',
                  getstrlink('Oh, My Goodness！草管人命！',
                  getstrlink('是啊，打着了，是啊',
                  getstrlink('足球是城市文明，钢板是教室文明。',nil)))))));
                waitmouse(2);
                if not ((die*[11..20]=[]) or stop1 or stop2 or finish) then begin
                  pm^.changeto(oneof(
                    getstrlink('先不要坐下，请继续弹。',
                    getstrlink('Again, who, which?',nil))));
                  waitmouse(0);
                end;
              until (die*[11..20]=[]) or (die*[1..10]<>[]) or stop1 or stop2 or finish or first;
              first:=false;
            end;
          until stop1 or stop2 or finish;
          if save then close(savefile);
          save:=false;
          if finish then break;
          la1:=0;
          la2:=0;
          for t:=1 to 50 do if coins[t]^.enable then begin
            if t<=10 then la1:=la1+1;
            if (t>10) and (t<=20) then la2:=la2+1;
          end;
          clist1^.add(la1);
          clist2^.add(la2);
          c1:=clist1^.v;
          c2:=clist2^.v;
          if ((c1=0)and(c2<>0))or((c1=0)and(c2=0)and(people)) then begin
            messagebox(oneof(
            getstrlink('您已经没有硬币了。不过没关系，胜败乃兵家常事，来日方长。',
            getstrlink('你已经输光了。还要努力啊！',
            getstrlink('没办法，谁让电脑这么厉害呢，还要加油啊！',nil)))),'结束',1);
            break
          end else if ((c2=0)and(c1<>0))or((c1=0)and(c2=0)and(not people)) then begin
            messagebox(oneof(
            getstrlink('酷毙了，你已消灭了电脑的全部硬币，获得了最终胜利。奖励吗，就是请你从头再玩一次吧。',
            getstrlink('你赢了，算你厉害，今天就先放过你。',
            getstrlink('电脑已经输光了，你还真是厉害，服了。',nil)))),'结束',1);
            break
          end else begin
            if ((la1=0)and(la2<>0)) or ((la1=0)and(la2=0)and(people)) then begin
              if messagebox('第'+stri(n)+'局结束，'+oneof(
                getstrlink('电脑获得胜利。没关系，再试试第'+stri(n+1)+'局',
                getstrlink('电脑赢了，不过你也很不错了，再努力吧。',
                getstrlink('你输了。小意思，下一局让你输得更惨。',
                getstrlink('我赢了。这就是你的水平啊，赢了你没什么可骄傲的。',nil))))),'结果',2)=2 then
                if reallyexit then break;
              if la2=coinnumber then begin
                messagebox('您没能弹掉电脑的任一枚硬币，于是再给电脑增加一枚硬币！','奖励',1);
                clist2^.add(1);
              end;
            end;
            if ((la2=0)and(la1<>0)) or ((la1=0)and(la2=0)and(not people)) then begin
              if messagebox('第'+stri(n)+'局结束，'+oneof(
                getstrlink('恭喜恭喜，您获得胜利。别骄傲，还有第'+stri(n+1)+'局',
                getstrlink('就让你赢一局好了，看下一局我让你输得很难看！',
                getstrlink('算你运气好，就让你赢一局吧。',
                getstrlink('弹得不错，你赢了。不过赢一局也没什么了不起的。',nil))))),'结果',2)=2 then
              if reallyexit then break;
              if la1=coinnumber then begin
                messagebox('您一枚硬币也没损失，特此再奖励您一枚硬币！','奖励',1);
                clist1^.add(1);
              end;
            end;
            n:=n+1;
            if mlist1^.v>mlist2^.v then begin
              messagebox('这一局的积分您比电脑高，您将被奖励一枚硬币！','奖励',1);
              clist1^.add(1);
            end;
            if mlist2^.v>mlist1^.v then begin
              messagebox('这一局的积分电脑比您高，电脑将被奖励一枚硬币！','奖励',1);
              clist2^.add(1);
            end;
          end;
        until (clist1^.v<=0) or (clist2^.v<=0) or finish;
      end;
    2:setup;
    3:about;
    4:PlayFile;
    end;
  until false;
  cl.done;
  finish:=true;
end;

procedure tm.InitControlPan;
var r:TRect;
begin
  r.assign(10,430,630,475,3);
  new(cp,init(r,$70));
  desktop^.insert(cp);
  cp^.active:=true;
  cp^.insert(new(PText,init('Coin',10,0,-10,6,5,3,3)));
  cp^.insert(new(PText,init('2000',12,75,-5,7,5,2,3)));
  r.assign(510,29,620,44,0);
  vlist:=new(PProgressBar,init(r,$F1,0,10000));
  cp^.insert(vlist);
  r.assign(200,30,500,43,1);
  new(pm,init(r,$1E,' '));
  cp^.insert(pm);
  r.assign(200,5,0,0,3);
  cp^.insert(new(PButton,init(r,' 完成 ',cmClose,kbESC,nil)));
  cp^.insert(newlabel('玩家得分',$30,260,5));
  cp^.insert(newlabel('剩余',$30,360,5));
  cp^.insert(newlabel('电脑得分',$30,420,5));
  cp^.insert(newlabel('剩余',$30,520,5));
  r.assign(310,5,350,17,1);
  new(mlist1,init(r,$30,'0'));
  cp^.insert(mlist1);
  r.assign(390,5,410,17,1);
  new(clist1,init(r,$30,'0'));
  cp^.insert(clist1);
  r.assign(470,5,510,17,1);
  new(mlist2,init(r,$30,'0'));
  cp^.insert(mlist2);
  r.assign(550,5,570,17,1);
  new(clist2,init(r,$30,'0'));
  cp^.insert(clist2);
  r.assign(585,10,0,0,8);
  new(l1,init(r,color1));
  cp^.insert(l1);
  r.assign(605,10,0,0,8);
  new(l2,init(r,color2));
  cp^.insert(l2);
  new(bell,init);
  cp^.insert(bell);
  cp^.drawall;
end;

procedure tm.GetCoinPosition;
var t,tt,m,n:integer;
    r:TRect;
    e:TEvent;
    o,p:TPoint;
  procedure ManRandomPut;
  var t:integer;
  begin
    for t:=1 to coinnumber do repeat
      coins[t]^.use(random(260)+20,random(360)+20,r1,color1,mg1,kdCoin)
    until not coins[t]^.hitother(tt);
    for t:=21 to stonenumber+20 do repeat
      coins[t]^.use(random(260)+20,random(360)+20,r3,color3,mg3,kdStone)
    until not coins[t]^.hitother(tt);
    for t:=41 to bombnumber+40 do repeat
      coins[t]^.use(random(260)+20,random(360)+20,r4,color4+color5*16,1,kdBomb)
    until not coins[t]^.hitother(tt);
    clist1^.add(-coinnumber);
    clist2^.add(-coinnumber);
  end;

  procedure ManPut;
  var t:integer;
  begin
    pm^.changeto(oneof(
      getstrlink('你认为把这些物体放在哪最好？放好后按“完成”按扭。',
      getstrlink('布置一下，要集中优势兵力，打歼灭战。',nil))));
    for t:=21 to stonenumber+20 do begin
      coins[t]^.use(150,(t-20)*35,r3,color3,mg3,kdStone);
      coins[t]^.draw;
    end;
    for t:=1 to (coinnumber) do begin
      coins[t]^.use(50,t*35,r1,color1,mg1,kdCoin);
      coins[t]^.draw;
    end;
    for t:=41 to 40+bombnumber do begin
      coins[t]^.use(200,(t-40)*35,r4,color4+color5*16,1,kdBomb);
      coins[t]^.draw;
    end;
    clist1^.add(-coinnumber);
    clist2^.add(-coinnumber);
    repeat
      getevent(e,false);
      handleevent(e);
      if e.what=evMouse then for t:=1 to 50 do if coins[t]^.enable then
        with coins[t]^ do
          if sqr(e.where.x-realx-m)+sqr(e.where.y-realy-n)<=sqr(radius) then begin
            table^.controlmouse;
            repeat
              o:=e.where;
              getmouseevent(e);
              if (e.where.x<>o.x) or (e.where.y<>o.y) then begin
                realx:=e.where.x-m;
                realy:=e.where.y-n;
                if not hitother(tt) then begin
                  hide;
                  x:=e.where.x-m;
                  y:=e.where.y-n;
                  draw;
                end else begin
                  realx:=x;
                  realy:=y;
                end;
              end;
            until e.what<>evMouse;
            desktop^.controlmouse;
          end;
    until e.command=cmClose;
    clearevent(e);
  end;

  procedure GetComputerPosition;
  var t:integer;
  begin
    case cm of
    1:begin
        for t:=11 to coinnumber+10 do
          coins[t]^.use(640-2*m-coins[t-10]^.x,410-coins[t-10]^.y,r2,color2,mg2,kdCoin);
        for t:=31 to stonenumber+30 do
          coins[t]^.use(640-2*m-coins[t-10]^.x,410-coins[t-10]^.y,r3,color3,mg3,kdStone);
        for t:=46 to bombnumber+45 do
          coins[t]^.use(640-2*m-coins[t-5]^.x, 410-coins[t-5]^.y, r4,color4+color5*16,1,kdBomb);
      end;
    2:begin
        for t:=11 to coinnumber+10 do
          coins[t]^.use(640-2*m-coins[t-10]^.x,coins[t-10]^.y,r2,color2,mg2,kdCoin);
        for t:=31 to stonenumber+30 do
          coins[t]^.use(640-2*m-coins[t-10]^.x,coins[t-10]^.y,r3,color3,mg3,kdStone);
        for t:=46 to bombnumber+45 do
          coins[t]^.use(640-2*m-coins[t-5]^.x,coins[t-5]^.y,r4,color4+color5*16,1,kdBomb);
      end;
    3:begin
        for t:=11 to coinnumber+10 do repeat
          coins[t]^.use(random(280)+320,random(360)+20,r2,color2,mg2,kdCoin)
        until not coins[t]^.hitother(tt);
        for t:=31 to stonenumber+30 do repeat
          coins[t]^.use(random(280)+320,random(360)+20,r3,color3,mg3,kdStone)
        until not coins[t]^.hitother(tt);
        for t:=46 to bombnumber+45 do repeat
          coins[t]^.use(random(280)+320,random(360)+20,r4,color4+color5*16,1,kdBomb)
        until not coins[t]^.hitother(tt);
        for t:=1 to 50 do if coins[t]^.enable then coins[t]^.draw;
      end;
    4:begin
        for t:=11 to coinnumber+10 do
          coins[t]^.use(590,(t-10)*35,r2,color2,mg2,kdCoin);
        for t:=31 to stonenumber+30 do
          coins[t]^.use(490,(t-30)*35,r3,color3,mg3,kdStone);
        for t:=46 to bombnumber+45 do
          coins[t]^.use(390,(t-45)*35,12,0,1,kdBomb);
      end;
    end;
  end;

begin
  m:=table^.bouns.a.x;
  n:=table^.bouns.a.y;
  repeat
    if randomput then ManRandomPut else ManPut;
    GetComputerPosition;
  Until PositionWell;
  for t:=1 to 50 do if coins[t]^.enable then coins[t]^.draw;
end;

function GetABetterName:string;
var s,l:string;
    t:integer;
begin
  for t:=1 to 999 do begin
    if t<10 then l:='00'+stri(t)
    else if t<100 then l:='0'+stri(t)
    else l:=stri(t);
    s:='PLAY'+l+'.C2K';
    if not existfile(s) then break;
  end;
  getabettername:=s;
end;

const
  cmCoinMax = $0191;
  cmStoneMax= $0192;
  cmBombMax = $0193;
type PBox1=^TBox1;
     TBox1=object(TDialogBox)
       i1,i2,i3:PNumBox;
       procedure userevent(var event:TEvent);virtual;
     end;
  procedure  TBox1.userevent;
  begin
    inherited userevent(event);
    if (event.what=evCommand) then case event.command of
      cmCoinMax:
        begin
          i1^.number^.changeto(stri(min(min(clist1^.v,clist2^.v),10)));
          clearevent(event);
        end;
      cmStoneMax:
        begin
          i2^.number^.changeto('10');
          clearevent(event);
        end;
      cmBombMax:
        begin
          i3^.number^.changeto('5');
          clearevent(event);
        end;
      end;
  end;

function getdatafromfile(filename:string):boolean;
var f:text;
    l,l2:string;
    m,x,y:integer;
begin
  getdatafromfile:=true;
  assign(f,filename);
  {$I-}
  reset(f);
  {$I+}
  if ioresult>0 then begin
    messagebox('所选文件'+filename+'不存在, 载入失败. ','错误',1);
    getdatafromfile:=false;
  end else begin
    cllong:=500;
    sd:=true;
    readln(f,l);
    if (l='Coin2000 Save File') or (l='Coin2000 Save File') then begin
      readln(f,l2);
      read(f,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,coinnumber,stonenumber,bombnumber);
      if l='Coin2000 Save File' then read(f,m,m);
      for m:=1 to 50 do begin
        if coins[m]^.enable then coins[m]^.hide;
        coins[m]^.die(false);
      end;
      for m:=1 to 50 do begin
        read(f,x,y);
        if x>0 then begin
          if (m in [1..10]) then coins[m]^.use(x,y,r1,color1,mg1,kdCoin);
          if (m in [11..20]) then coins[m]^.use(x,y,r2,color2,mg2,kdCoin);
          if (m in [21..40]) then coins[m]^.use(x,y,r3,color3,mg3,kdStone);
          if (m in [41..50]) then coins[m]^.use(x,y,r1,color4+color5*16,0,kdBomb);
          coins[m]^.draw;
        end;
      end;
    end else begin
      messagebox('这个文件不是由Coin 2000创建的.','错误',1);
      getdatafromfile:=false;
    end;
    close(f);
  end;
end;



procedure tm.GetCoinMessage;
var d:PBox1;
    c1,c2,c3:PCheckBox;
    n1:PInputBox;
    r:TRect;
    l:string;
    t:integer;
begin
  r.assign(220,130,420,345,3);
  new(d,init(r,$AA,'第'+stri(n)+'局',false));
  r.assign(10,40,114,60,0);
  d^.insert(new(PLabel,init(r,$0,'请输入硬币数:')));
  r.assign(110,40,150,52,2);
  new(d^.i1,init(r,$F0,1,10,coinnumber,1));
  d^.insert(d^.i1);
  r.assign(10,65,114,85,0);
  d^.insert(new(PLabel,init(r,$0,'请输入棋子数:')));
  r.assign(110,65,150,77,2);
  new(d^.i2,init(r,$F0,0,10,stonenumber,1));
  d^.insert(d^.i2);
  r.assign(10,90,114,110,0);
  d^.insert(new(PLabel,init(r,$0,'请输入炸弹数:')));
  r.assign(110,90,150,102,2);
  new(d^.i3,init(r,$F0,0,5,bombnumber,1));
  d^.insert(d^.i3);
  r.assign(160,40,0,0,2);
  d^.insert(new(PButton,init(r,'最多',cmCoinMax,kbNoKey,nil)));
  r.assign(160,65,0,0,2);
  d^.insert(new(PButton,init(r,'最多',cmStoneMax,kbNoKey,nil)));
  r.assign(160,90,0,0,2);
  d^.insert(new(PButton,init(r,'最多',cmBombMax,kbNoKey,nil)));
  r.assign(10,115,0,0,0);
  new(c1,init(r,'随机布置(~R~)',kbAltR,randomput));
  d^.insert(c1);
  r.assign(110,115,0,0,0);
  new(c2,init(r,'玩家先弹(~P~)',kbAltP,manfirst>0));
  d^.insert(c2);
  r.assign(10,140,0,0,0);
  new(c3,init(r,'录相存储为(~E~)',kbAltE,false));
  d^.insert(c3);
  r.assign(110,140,190,154,2);
  new(n1,init(r,100,GetABetterName,$F0,filenamechar));
  d^.insert(n1);
  r.assign(10,170,190,171,0);
  d^.insert(new(PLine,init(r,$8F)));
  r.assign(15,185,0,0,5);
  d^.insert(new(PButton,init(r,' 确定 ',$FF00,kbEnter,nil)));
  r.assign(75,185,0,0,5);
  d^.insert(new(PButton,init(r,' 取消 ',$FF01,kbESC,nil)));
  r.assign(135,185,0,0,5);
  d^.insert(new(PButton,init(r,'载入布局',$FF02,kbESC,nil)));
  pm^.changeto(oneof(
    getstrlink('要几个硬币和棋子，你觉得呢？',
    getstrlink('要几个，自已想，别看别人的。',
    getstrlink('这个游戏就是拿钢板，轰轰这个，轰轰那个。',nil)))));
  repeat
    needgetposition:=true;
    d^.execute;
    RandomPut:=c1^.Enabled;
    ManFirst:=ord(c2^.Enabled);
    Save:=c3^.Enabled;
    SaveName:=n1^.GetText;
    case d^.result of
    0:begin
      with d^ do begin
        coinnumber:=min(validvalue(i1^.v,1,10),min(clist1^.v,clist2^.v));
        stonenumber:=validvalue(i2^.v,0,10);
        bombnumber:=validvalue(i3^.v,0,5);
      end;
      break; end;
    1:if reallyexit then begin
      finish:=true;
      break; end;
    2:begin
        randomput:=false;
        l:=filenamebox('请选择一个文件',newitem('C2K',cmNoCommand,nil,nil));
        if (l<>'') and getdatafromfile(l) then
          if (coinnumber>clist1^.v) or (coinnumber>clist2^.v) then
            messagebox('所选文件中指定的硬币数大于现有硬币数, 请换另一文件. ','错误',1)
          else if positionwell then begin
            needgetposition:=false;
            clist1^.add(-coinnumber);
            clist2^.add(-coinnumber);
            for t:=1 to 50 do if coins[t]^.enable then coins[t]^.draw;
            break;
          end;
      end;
    end;
  until false;
  dispose(d,done);
end;

procedure tm.GetV;
var e:TEvent;
    t,tt,m,n:integer;
    o:TPoint;
    stop:boolean;
    s:double;
    l:string;
begin
  m:=table^.bouns.a.x;
  n:=table^.bouns.a.y;
  getevent(e,false);
  stop:=false;
  activecoin:=0;
  pm^.changeto(oneof(
    getstrlink('先确定反应物和反应方向，然后按住左键催化。',
    getstrlink('确定状态，列出方程，搭出框架，然后再弹',
    getstrlink('弹钢板五个步骤：瞄，等，动，定，掉。',
    getstrlink('孰板半径大？孰板得分多？',
    getstrlink('弹钢板也遵循着“三步曲”：瞄，按，放',
    getstrlink('这个游戏，就是所谓的，钢板两千',
    getstrlink('看我的游戏，眉清目秀，啊，好游戏！',
    getstrlink('弹钢板，就是小孩，玩小球。',
    getstrlink('天天做阅读，天天做完形，天天弹钢板',nil)))))))))));
  l1^.light(true);
  vlist^.go_to(0);
  repeat
    o:=e.where;
    handleevent(e);
    getevent(e,true);
    case e.what of
    evNothing:
      begin
        NoSound;
        if vlist^.value=0 then for t:=1 to 10 do
          if (coins[t]^.enable) and (coins[t]^.kind=kdCoin) and (t<>activecoin) then
             with coins[t]^ do
               if sqr(e.where.x-realx-m)+sqr(e.where.y-realy-n)<=sqr(radius) then begin
                 tt:=activecoin;
                 activecoin:=t;
                 if tt>0 then begin
                   coins[tt]^.v:=0;
                   coins[tt]^.sita:=0;
                   cl.hide;
                   coins[tt]^.draw;
                 end;
                 draw;
                 s:=getsita(e.where.x,e.where.y,x+m,y+n);
                 cl.drawat2(x+m,y+n,trunc(x+m+cllong*cos(s)),trunc(y+n+cllong*sin(s)));
               end;
        if (activecoin>0) and ((o.x<>e.where.x) or (o.y<>e.where.y)) then with coins[activecoin]^ do begin
          s:=getsita(e.where.x,e.where.y,x+m,y+n);
          cl.drawat2(x+m,y+n,trunc(coins[activecoin]^.x+m+cllong*cos(s)),trunc(coins[activecoin]^.y+n+cllong*sin(s)));
        end;
        if (activecoin>0) and (vlist^.value>0) then begin
          cl.hide;
          coins[activecoin]^.v:=vlist^.value/500;
          vlist^.go_to(0);
          stop:=true;
        end;
      end;
    evMouse:
      if activecoin>0 then begin
        cl.hide;
        if vlist^.value=0 then
          coins[activecoin]^.sita:=getsita(e.where.x,e.where.y,coins[activecoin]^.x+m,coins[activecoin]^.y+n);
        case e.Button of
        3:if (vlist^.value>0) then begin
            vlist^.go_to(0);
            nosound;
          end;
        1:if vlist^.value<maxv*500 then begin
            vlist^.go(8);
            wait(4);
            if sd then sound(vlist^.value div 10+300)
          end;
        end;
      end;
    evCommand:
      begin
        nosound;
        if e.command=cmClose then if reallyexit then begin
          finish:=true;
          stop:=true;
        end else vlist^.value:=0;;
        clearevent(e);
      end;
    evKey:
      begin
        if e.keycode=kbEnter then l:=inputbox('Please input message:','Input','',100,[28..255]);
        if l='i am safe' then begin
          bhbwz:=not bhbwz;
          if bhbwz then messagebox('误炸开关：禁止误炸',' ',1) else messagebox('误炸开关：允许误炸',' ',1);
          clearevent(e);
        end else if l='continue game' then begin
          clist1^.add(20);
          clist2^.add(20);
          clearevent(e);
        end else if l='heavy stone' then begin
          l:=inputbox(' ',' ',stri(mg3),3,[kb0..kb9]);
          mg3:=validvalue(value(l),5,100);
          for t:=21 to 40 do coins[t]^.mg:=mg3;
          clearevent(e);
        end else if l='link it' then begin
          lsbp:=not lsbp;
          if lsbp then messagebox('连锁爆破：开',' ',1) else messagebox('连锁爆破：关',' ',1);
          clearevent(e);
        end else if l='widely kill' then begin
          l:=inputbox(' ',' ',stri(r5),3,[kb0..kb9]);
          r5:=validvalue(value(l),5,100);
          clearevent(e);
        end else if l='help me' then begin
          helpme;
          stop:=true;
        end;
        if (e.what=evNothing) and save then begin
          save:=false;
          close(savefile);
        end;
      end;
    end;
  until stop;
  if (activecoin>0) and coins[activecoin]^.enable then begin
    t:=activecoin;
    activecoin:=0;
    coins[t]^.draw;
    coins[t]^.sita:=trunc(coins[t]^.sita*1E5)*1E-5;
  end;
  l1^.light(false);
end;

procedure TryToGo(var m:integer;a,zf:integer);
var stop:boolean;
    t2:integer;
begin
  m:=0;
  repeat
    stop:=true;
    for t2:=1 to 10 do if coins[t2]^.v>0 then if not coins[t2]^.go(false) then m:=m+zf*a;
    for t2:=11 to 20 do if coins[t2]^.v>0 then if not coins[t2]^.go(false) then m:=m-(4-zf)*a;
    for t2:=21 to 40 do if coins[t2]^.v>0 then if not coins[t2]^.go(false) then m:=m+ord(add);
    for t2:=1 to 40 do if coins[t2]^.enable and (coins[t2]^.v<>0) then stop:=false;
  until stop;
end;

type TResult=record
       mark,n1:integer;
       v,sita:double;
     end;

procedure tm.helpme;
var zf2,cs,p,q,at,t,t1,t2,t4,m,a,b:integer;
    re:TResult;
    t3:longint;
    vv,ss,st:double;
    d:TDialogBox;
    r:TRect;
    s1,s2:PSlider;
    c1:PCheckBox;
    p1:PProgressBar;
    sj:boolean;
begin
  table^.getxy(p,q);
  re.mark:=-10000;
  r.assign(230,165,410,315,2);
  d.init(r,$7F,' ',false);
  d.insert(newlabel('作风  守',$70,20,30));
  d.insert(newlabel('攻',$70,150,30));
  r.assign(70,30,140,45,0);
  new(s1,init(r,$77,0,4,dnzf,nil));
  d.insert(s1);
  d.insert(newlabel('次数  少',$70,20,60));
  d.insert(newlabel('多',$70,150,60));
  r.assign(70,60,140,75,0);
  new(s2,init(r,$77,1,5,gamev,nil));
  d.insert(s2);
  r.assign(20,90,0,0,0);
  new(c1,init(r,'随机试弹',kbNoKey,sjst));
  d.insert(c1);
  r.assign(70,120,0,0,2);
  d.insert(new(PButton,init(r,' 开始 ',cmClose,kbEnter,nil)));
  d.execute;
  zf2:=s1^.vx;
  cs:=s2^.vx;
  sj:=c1^.enabled;
  d.done;
  r.assign(200,210,440,270,2);
  d.init(r,$7F,'正在试弹',false);
  r.assign(20,30,220,44,1);
  new(p1,init(r,$F1,0,100));
  d.insert(p1);
  d.SaveScreen^.Save;
  d.Active:=true;
  d.Draw;
  d.DrawSub;
  for t2:=1 to 50 do c[t2]^:=coins[t2]^;
  for t:=1 to 10 do if coins[t]^.enable then begin
    for t1:=11 to 20 do if (t1<>t) and coins[t1]^.enable then begin
      p1^.go_to((t-1)*10+t1-10);
  st:=arctan(coins[t1]^.radius/sqrt(abs(sqr(coins[t1]^.x-coins[t]^.x)+sqr(coins[t1]^.y-coins[t]^.y)-sqr(coins[t1]^.radius))));
      for t4:=-(cs div 2) to (cs div 2) do begin
        vv:=maxv;
        coins[t]^.v:=vv;
        ss:=getsita(coins[t1]^.realx,coins[t1]^.realy,coins[t]^.realx,coins[t]^.realy)+pi+st/cs*t4*2;
        coins[t]^.sita:=ss;
        trytogo(m,-1,zf2);
        for t2:=1 to 50 do coins[t2]^:=c[t2]^;
        if m>re.mark then begin
          re.mark:=m;
          re.n1:=t;
          re.sita:=ss;
          re.v:=vv;
        end;
      end;
    end;
  end;
  p1^.max:=cs*10;
  if sj then for t:=1 to cs*10 do begin
    p1^.go_to(t);
    vv:=random(maxv-6)+6;
    coins[re.n1]^.v:=vv;
    ss:=random*2*pi;
    coins[re.n1]^.sita:=ss;
    trytogo(m,-1,zf2);
    if m>re.mark then begin
      re.mark:=m;
      re.sita:=ss;
      re.v:=vv;
    end;
    for t2:=1 to 50 do coins[t2]^:=c[t2]^;
  end;
  d.active:=false;
  d.SaveScreen^.WriteOut;
  d.done;
  cl.hide;
  at:=activecoin;
  activecoin:=re.n1;
  if at>0 then coins[at]^.draw;
  coins[activecoin]^.draw;
  cl.drawat2(trunc(coins[re.n1]^.x+p+cllong*cos(re.sita)),trunc(coins[re.n1]^.y+q+cllong*sin(re.sita)),
    coins[re.n1]^.x+p,coins[re.n1]^.y+q);
  delay(500);
  vlist^.go_to(0);
  coins[activecoin]^.v:=re.v;
  coins[activecoin]^.sita:=re.sita;
  for t3:=1 to trunc(re.v)*63 do begin
    vlist^.go(8);
    if sd then sound(vlist^.value div 10+300);
    wait(4);
  end;
  nosound;
  cl.hide;
  if (activecoin>0) and coins[activecoin]^.enable then begin
    t:=activecoin;
    activecoin:=0;
    coins[t]^.draw;
  end;
  l2^.light(false);
  coins[t]^.sita:=trunc(coins[t]^.sita*1E5)*1E-5;
end;

procedure tm.cgetv;
var p,q,at,t,t1,t2,t4,m,a,b:integer;
    re:TResult;
    stop:boolean;
    t3:longint;
    vv,ss,st:double;
begin
  table^.getxy(p,q);
  at:=activecoin;
  re.mark:=-10000;
  pm^.changeto(oneof(
    getstrlink('等我再考虑考虑……',
    getstrlink('抱赚，我有点事，稍等一下。',
    getstrlink('你先读读课文，我出去一下……',
    getstrlink('左想五秒，停两秒，右想五秒，停两秒',nil))))));
  l2^.light(true);
  for t2:=1 to 50 do c[t2]^:=coins[t2]^;
  for t:=11 to 20 do if coins[t]^.enable then begin
    for t1:=1 to 10 do if (t1<>t) and coins[t1]^.enable then begin
  st:=arctan(coins[t1]^.radius/sqrt(abs(sqr(coins[t1]^.x-coins[t]^.x)+sqr(coins[t1]^.y-coins[t]^.y)-sqr(coins[t1]^.radius))));
      for t4:=-(gamev div 2) to (gamev div 2) do begin
        vv:=maxv;
        coins[t]^.v:=vv;
        ss:=getsita(coins[t1]^.realx,coins[t1]^.realy,coins[t]^.realx,coins[t]^.realy)+pi+st/gamev*t4*2;
        coins[t]^.sita:=ss;
        trytogo(m,1,dnzf);
        for t2:=1 to 50 do coins[t2]^:=c[t2]^;
        if m>re.mark then begin
          cl.hide;
          if re.n1<>t then begin
            activecoin:=t;
            if at>0 then coins[at]^.draw;
            coins[t]^.draw;
            at:=t;
          end;
          a:=coins[t]^.x;
          b:=coins[t]^.y;
          cl.drawat2(a+p,b+q,trunc(a+p+cllong*cos(ss)),trunc(b+q+cllong*sin(ss)));
          re.mark:=m;
          re.n1:=t;
          re.sita:=ss;
          re.v:=vv;
        end;
      end;
    end;
  end;
  if sjst and (re.mark<gamev div 3) then for t:=1 to gamev*10 do begin
    vv:=random(maxv-6)+6;
    coins[re.n1]^.v:=vv;
    ss:=random*2*pi;
    coins[re.n1]^.sita:=ss;
    trytogo(m,1,dnzf);
    if m>re.mark then begin
      a:=c[re.n1]^.x;
      b:=c[re.n1]^.y;
      cl.drawat2(a+p,b+q,trunc(a+p+cllong*cos(ss)),trunc(b+q+cllong*sin(ss)));
      re.mark:=m;
      re.sita:=ss;
      re.v:=vv;
    end;
    for t2:=1 to 50 do coins[t2]^:=c[t2]^;
  end;
  cl.hide;
  pm^.changeto(oneof(
    getstrlink('我觉得呢，应该这样弹！',
    getstrlink('瞬那间，弹掉你',
    getstrlink('正步走，一步两动！',
    getstrlink('马上就让你的钢板，分道扬镳',
    getstrlink('我弹的最好的一次是下一次。',nil)))))));
  activecoin:=re.n1;
  if at>0 then coins[at]^.draw;
  coins[activecoin]^.draw;
  cl.drawat2(trunc(coins[re.n1]^.x+p+cllong*cos(re.sita)),trunc(coins[re.n1]^.y+q+cllong*sin(re.sita)),
    coins[re.n1]^.x+p,coins[re.n1]^.y+q);
  delay(500);
  vlist^.go_to(0);
  coins[activecoin]^.v:=re.v;
  coins[activecoin]^.sita:=re.sita;
  for t3:=1 to trunc(re.v)*63 do begin
    vlist^.go(8);
    if sd then sound(vlist^.value div 10+300);
    wait(4);
  end;
  nosound;
  cl.hide;
  if (activecoin>0) and coins[activecoin]^.enable then begin
    t:=activecoin;
    activecoin:=0;
    coins[t]^.draw;
  end;
  l2^.light(false);
  coins[t]^.sita:=trunc(coins[t]^.sita*1E5)*1E-5;
end;

procedure TM.PlayFile;
var filename:string;
    f:Text;
    l:string;
    r:TRect;
    m,t,x,y,p,q:integer;
    v,sita:double;
begin
  filename:=filenamebox('请选择一个文件',newitem('C2K',cmNoCommand,nil,nil));
  if filename='' then exit;
  assign(f,filename);
  {$I-}
  reset(f);
  {$I+}
  if doserror>0 then messagebox('打开文件 '+filename+' 时发生错误, 不能放录相.','错误',1)
  else begin
    cllong:=500;
    sd:=true;
    readln(f,l);
    if (l='Coin2000 Save File') or (l='Coin2000 Save File') then begin
      readln(f,player);
      pm^.changeto('这是'+player+'与电脑对战的录相');
      read(f,mg1,mg2,mg3,color1,color2,color3,color4,color5,dcolor,r1,r2,r3,r4,r5,cm,gamev,coinnumber,stonenumber,bombnumber);
      if l='Coin2000 Save File' then begin
        read(f,x,y);
        lsbp:=(x=1);
        bhbwz:=(y=1);
      end;
      for t:=1 to 50 do begin
        if coins[t]^.enable then coins[t]^.hide;
        coins[t]^.die(false);
      end;
      table^.getxy(p,q);
      table^.color:=dcolor*16;
      table^.draw;
      l1^.color:=color1;
      l2^.color:=color2;
      mlist1^.change(0);
      mlist2^.change(0);
      ma1:=0;
      ma2:=0;
      for t:=1 to 50 do begin
        read(f,x,y);
        if x>0 then begin
          if (t in [1..10]) then coins[t]^.use(x,y,r1,color1,mg1,kdCoin);
          if (t in [11..20]) then coins[t]^.use(x,y,r2,color2,mg2,kdCoin);
          if (t in [21..40]) then coins[t]^.use(x,y,r3,color3,mg3,kdStone);
          if (t in [41..50]) then coins[t]^.use(x,y,r1,color4+color5*16,0,kdBomb);
          coins[t]^.draw;
        end;
      end;
      repeat
        read(f,m,t,v,sita);
        if v>0 then begin
          if m=1 then l1^.light(true) else l2^.light(true);
          coins[t]^.v:=v;
          coins[t]^.sita:=sita;
          cl.hide;
          activecoin:=t;
          coins[activecoin]^.draw;
          activecoin:=0;
          delay(500);
          cl.drawat2(trunc(coins[t]^.x+p+cllong*cos(sita)),trunc(coins[t]^.y+q+cllong*sin(sita)),
            coins[t]^.x+p,coins[t]^.y+q);
          delay(500);
          vlist^.go_to(0);
          for t:=1 to trunc(v)*63 do begin
            vlist^.go(8);
            if sd then sound(vlist^.value div 10+300);
            wait(4);
          end;
          delay(500);
          nosound;
          cl.hide;
          doit(m);
          if m=1 then l1^.light(false) else l2^.light(false);
          waitmouse(1);
        end;
      until eof(f);
      waitmouse(5);
      messagebox('放相结束','完成',1);
    end else messagebox('这个文件不是由Coin 2000创建的.','错误',1);
    close(f);
  end;
end;

begin
  app.init;
  app.run;
  app.done;
end.
