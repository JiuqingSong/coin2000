{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Drivers                          }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

Unit GraphDrv;

interface

uses Graph,Dos,CrtA,GraphCon,GraphCrt;

type

  TRect = object
    a,b:TPoint;
    wide:integer;
    procedure assign(x1,y1,x2,y2:integer;w:integer);
    procedure Move(x,y:integer);
  end;

  PEvent = ^TEvent;
  TEvent = record
    Ptr:Pointer;
    Where:TPoint;
    What: Word;
    case Word of
      evNothing: ();
      evMouse: (Button: Byte);
      evKey: (KeyCode: Word);
      evCommand:(Command:word);
  end;

  PObject = ^TObject;
  TObject = object
    bouns:TRect;
    color:byte;
    owner,next:PObject;
    valid:Boolean;
    constructor init(r:TRect;c:byte);
    procedure draw;virtual;
    procedure Hide;virtual;
    procedure getxy(var x,y:integer);virtual;
    procedure HandleEvent(var event:TEvent);virtual;
    procedure ControlMouse;
    procedure DrawAll;virtual;
    function mouseon(p:TPoint):boolean;virtual;
    function CanReceiveMessage:Boolean;virtual;
    destructor done;virtual;
  end;

  PSaveScreen=^TSaveScreen;
  TSaveScreen=object(TObject)
    screen:array[1..3] of pointer;
    rect:array[1..3,1..2] of TRect;
    constructor init(R:TRect);
    procedure save;
    procedure WriteOut;
    destructor done;virtual;
  end;

  PGroup=^TGroup;
  TGroup=Object(TObject)
    Sub:PObject;
    active:Boolean;
    constructor init(R:TRect;c:integer);
    procedure insert(P:PObject);virtual;
    procedure delete(P:PObject);
    procedure HandleEvent(var event:TEvent);virtual;
    procedure DrawSub;virtual;
    procedure DrawAll;virtual;
    function canreceivemessage:boolean;virtual;
    destructor done;virtual;
  end;

  PChineseInputBox=^TChineseInputBox;
  TChineseInputBox=object(TObject)
    inputfile:file of char;
    line:integer;
    name:PString;
    HotKey:word;
    keyin:PString;
    active:Boolean;
    savescreen:PSaveScreen;
    point:array[1..500] of record
      key:string[6];
      sk:word;
      total:byte;
    end;
    constructor init(R:TRect;i:string;n:string;h:word);
    procedure draw;virtual;
    procedure writekeyin;
    procedure HandleEvent(var event:TEvent);virtual;
    procedure Execute(keycode:Word);
    destructor done;virtual;
  end;

  PEventLink=^TEventLink;
  TEventLink = record
    ThisEvent:TEvent;
    Next:PEventLink;
  end;

  TValidCommand=set of 0..255;

  procedure np(a:string;x,y:integer;c:integer);
  procedure npLabel(a:string;x,y:integer;c1,c2:integer);
  function LenLabel(a:string):integer;
  procedure drawicon(n:string;x,y:integer);
  procedure npin(a:String;x,y,l,c:integer);
  function copylabel(a:String;p:integer):string;
  function Message(p:PObject;command:word;ptr:PObject):boolean;
  procedure GetMouseEvent(var Event:TEvent);
  procedure GetEvent(var Event:TEvent;EnableChinese:boolean);
  procedure PutEvent(Event:TEvent);
  procedure ClearEvent(var event:TEvent);
  procedure DisableCommand(d:TValidCommand);
  procedure EnableCommand(d:TValidCommand);
  procedure disablechineseinput;
  procedure enablechineseinput;
  function mousein(p:PObject;o:TPoint;t:integer):boolean;
  procedure GetRect(var r:TRect);
  procedure GetRectTo(var r:TRect);
  procedure InitAll;
  procedure CloseAll;

var turbohzk:file of byte;
    littlechar,Finish:Boolean;
    TempEvent:PEventLink;
    chineseinputbox:PChineseInputBox;
    disabledcommand:TValidCommand;
    CharSize:byte;
    DeskTopColor:integer;
    ICGName:string;
    EnableMouseKey:Boolean;

implementation

var chinese2:PChineseInputBox;

{ TRect }

procedure TRect.Assign;
begin
  a.x:=x1;
  a.y:=y1;
  b.x:=x2-x1;
  b.y:=y2-y1;
  wide:=w;
  if b.x<0 then b.x:=0;
  if b.y<0 then b.y:=0;
end;

procedure TRect.Move;
begin
  a.x:=a.x+x;
  a.y:=a.y+y;
end;

{ TObject }

constructor TObject.Init;
begin
  bouns:=r;
  color:=c;
  owner:=nil;
  next:=nil;
  valid:=true;
end;

procedure TObject.draw;
begin
end;

procedure TObject.GetXY;
var a,b:integer;
begin
  if owner=nil then
  begin
    x:=bouns.a.x;
    y:=bouns.a.y
  end
  else begin
    owner^.getxy(a,b);
    x:=bouns.a.x+a;
    y:=bouns.a.y+b;
  end;
end;

procedure TObject.HandleEvent;
begin
  if next<>nil then next^.handleevent(event);
end;

procedure TObject.ControlMouse;
var r:registers;
    x,y:integer;
begin
  getxy(x,y);
  r.ax:=7;
  r.cx:=x;
  r.dx:=x+bouns.b.x;
  intr($33,r);
  r.ax:=8;
  r.cx:=y;
  r.dx:=y+bouns.b.y;
  intr($33,r);
end;

procedure TObject.DrawAll;
begin
  if valid then draw;
  if next<>nil then next^.DrawAll;
end;

procedure TObject.Hide;
var x,y,c:integer;
begin
  getxy(x,y);
  if owner<>nil then c:=owner^.color div 16 else c:=7;
  mhide;
  with bouns do drawline(x,y,x+b.x,y+b.y,wide,c,c,c);
  mshow;
end;

function TObject.CanReceiveMessage;
begin
  if owner=nil then canreceivemessage:=valid
    else canreceivemessage:=owner^.canreceivemessage and valid;
end;

function TObject.mouseon;
var x,y,x1,x2,y1,y2:integer;
begin
  getxy(x,y);
  x1:=x-bouns.wide;
  y1:=y-bouns.wide;
  x2:=x+bouns.b.x+bouns.wide;
  y2:=y+bouns.b.y+bouns.wide;
  mouseon:=(p.x>=x1) and (p.x<=x2) and (p.y>=y1) and (p.y<=y2)
end;

destructor TObject.done;
begin
  if next<>nil then dispose(next,done);
end;

{ TGroup }

constructor TGroup.init;
begin
  TObject.Init(R,c);
  sub:=nil;
  active:=false;
end;

procedure TGroup.Insert;
var q:PObject;
begin
  if p^.valid then begin
    q:=p;
    while q^.next<>nil do begin
      q^.owner:=@self;
      q:=q^.next;
    end;
    q^.next:=sub;
    sub:=p;
    sub^.owner:=@self;
  end else dispose(p,done);
end;

procedure TGroup.Delete;
var q,r:PObject;
begin
  q:=sub;
  r:=nil;
  while q<>nil do begin
    if p=q then begin
      if r<>nil then r^.next:=q^.next else sub:=q^.next;
      q^.owner:=nil;
      q^.next:=nil;
      dispose(q,done);
      exit
    end;
    r:=q;
    q:=q^.next;
  end;
end;

procedure TGroup.HandleEvent;
begin
  inherited handleevent(event);
  if active then if sub<>nil then sub^.handleevent(event);
end;

procedure TGroup.DrawSub;
begin
  if sub<>nil then if active then sub^.DrawAll
end;

procedure TGroup.DrawAll;
begin
  inherited drawall;
  drawSub;
end;

function TGroup.CanReceiveMessage;
begin
  if owner=nil then canreceivemessage:=valid
    else canreceivemessage:=owner^.canreceivemessage and valid and active;
end;

destructor TGroup.done;
begin
  if sub<>nil then dispose(sub,done);
  inherited done;
end;

{ TSaveScreen }

constructor TSaveScreen.init;
var re:TRect;
    h:integer;
begin
  re.assign(0,0,r.b.x,r.b.y,r.wide);
  TObject.init(re,0);
  h:=(r.b.y+2*r.wide) div 3;
  with r do begin
    rect[1,1].assign(-wide,-wide,b.x+wide,wide+h,0);
    rect[2,1].assign(-wide,-wide+h+1,b.x+wide,b.y+wide-h,0);
    rect[3,1].assign(-wide,b.y+wide-h+1,b.x+wide,b.y+wide,0);
    rect[1,2]:=rect[1,1];
    rect[2,2]:=rect[2,1];
    rect[3,2]:=rect[3,1];
  end;
  screen[1]:=nil;
  screen[2]:=nil;
  screen[3]:=nil;
  valid:=h>0;
end;

procedure TSaveScreen.Save;
var t,x,y:integer;
    s:longint;
begin
  mhide;
  getxy(x,y);
  for t:=1 to 3 do begin
    if screen[t]<>nil then
      freemem(screen[t],imagesize(rect[t,2].a.x,rect[t,2].a.y,rect[t,2].b.x,rect[t,2].b.y));
    rect[t,2].a.x:=validvalue(x+rect[t,1].a.x,0,639);
    rect[t,2].a.y:=validvalue(y+rect[t,1].a.y,0,479);
    rect[t,2].b.x:=validvalue(x+rect[t,1].a.x+rect[t,1].b.x,0,639);
    rect[t,2].b.y:=validvalue(y+rect[t,1].a.y+rect[t,1].b.y,0,479);
    s:=imagesize(rect[t,2].a.x,rect[t,2].a.y,rect[t,2].b.x,rect[t,2].b.y);
    if s>3 then begin
      getmem(screen[t],s);
      getimage(rect[t,2].a.x,rect[t,2].a.y,rect[t,2].b.x,rect[t,2].b.y,screen[t]^)
    end else screen[t]:=nil;
  end;
  mshow;
end;

procedure TSaveScreen.WriteOut;
var t:integer;
begin
  mhide;
  for t:=1 to 3 do if screen[t]<>nil then with rect[t,2] do begin
    putimage(a.x,a.y,screen[t]^,0);
    FreeMem(screen[t],imagesize(a.x,a.y,b.x,b.y));
    screen[t]:=nil;
  end;
  mshow;
end;

destructor TSaveScreen.Done;
var t:integer;
begin
  for t:=1 to 3 do if screen[t]<>nil then with rect[t,2] do
    FreeMem(screen[t],imagesize(a.x,a.y,a.x+b.x,a.y+b.y));
  inherited done;
end;

{ TChineseInputBox }

constructor TChineseInputBox.init;
var a,b:char;
    t,tt:integer;
begin
  TObject.init(R,$70);
  name:=NewStr(n);
  assign(inputfile,findfile(i));
  {$I-}
  reset(inputfile);
  {$I+}
  valid:=ioresult=0;
  valid:=valid and (name<>nil);
  if not valid then exit;
  bouns.b.x:=(length(n)+32)*charsize;
  bouns.b.y:=charsize*2-1;
  bouns.wide:=3;
  new(savescreen,init(bouns));
  savescreen^.bouns.a.x:=bouns.a.x;
  savescreen^.bouns.a.y:=bouns.a.y;
  hotkey:=h;
  keyin:=nil;
  read(inputfile,a);
  read(inputfile,b);
  line:=ord(a)*256+ord(b);
  for t:=1 to line do begin
    point[t].key:='';
    for tt:=1 to 6 do begin read(inputfile,a);point[t].key:=point[t].key+a end;
    read(inputfile,a);
    read(inputfile,b);
    point[t].sk:=ord(a)*256+ord(b);
    read(inputfile,a);
    point[t].total:=ord(a);
    active:=false;
  end;
end;

procedure TChineseInputBox.draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  if active then begin
    savescreen^.save;
    with bouns do begin
      drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,15,8,7);
      if valid then np(name^,x,y,color mod 16);
      drawline(x+b.x-31*charsize,y,x+b.x-21*charsize,y+b.y,1,8,15,7);
      drawline(x+b.x-20*charsize,y,x+b.x,y+b.y,1,8,15,7);
    end;
  end else savescreen^.writeout;
  mshow;
end;

procedure TChineseInputBox.writekeyin;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do begin
    drawline(x+b.x-31*charsize,y,x+b.x-21*charsize,y+b.y,1,8,15,7);
    if keyin<>nil then np(keyin^,x+lenstr(name)*charsize+charsize,y,color mod 16);
  end;
  mshow;
end;

procedure TChineseInputBox.HandleEvent;
begin
  if event.KeyCode=hotkey then begin
    active:=not active;
    deletestr(keyin,1,lenstr(keyin));
    draw;
  end else if active then case event.keycode of
  97..122:if lenstr(keyin)<6 then begin
            AddStr(keyin,chr(event.keycode));
            event.what:=evNothing;
            writekeyin;
          end;
  8:if keyin<>nil then begin
      deletestr(keyin,lenstr(keyin),1);
      event.what:=evNothing;
      writekeyin;
    end;
  32:if keyin<>nil then begin
       Execute(event.keycode);
       event.what:=evNothing;
       deletestr(keyin,1,lenstr(keyin));
       writekeyin;
     end;
  end;
end;

procedure TChineseInputBox.Execute;
var x,y,com,page,total,nowpage,t,tt:integer;
    e:TEvent;
    h:string;

  function CanReadFromFile(var h:string;var page:integer):Boolean;
  var t,tt:integer;
      c:char;
  begin
    canreadfromfile:=false;
    for t:=1 to line do begin
    if (keyin<>nil) and (noblank(point[t].key)=keyin^) then break;
      if t=line then exit;
    end;
    canreadfromfile:=true;
    seek(inputfile,point[t].sk);
    h:='';
    total:=point[t].total;
    for t:=1 to total*2 do begin read(inputfile,c);h:=h+c end;
    page:=(total-1) div 5+1;
  end;

  procedure WriteNothing;
  begin
    mhide;
    with bouns do drawline(x+b.x-20*charsize,y,x+b.x,y+b.y,1,8,15,7);
    mshow;
  end;

  procedure writehz(var tt:integer);
  var t:integer;
  begin
    writenothing;
    mhide;
    if nowpage=page then tt:=(total-1) mod 5+1 else tt:=5;
    with bouns do for t:=1 to tt do
      nplabel('~'+stri(t)+'.'+'~'+h[nowpage*10-10+t*2-1]+h[nowpage*10-10+t*2],
        x+b.x+charsize*(t*4-24),y,0,4);
    mshow;
  end;

  function GetCommand:integer;
  var e:TEvent;
  begin
    repeat
      getevent(e,false);
      if e.what=evKey then case e.keycode of
      49..53:getcommand:=e.keycode-48;
      32:getcommand:=1;
      45:getcommand:=6;
      61:getcommand:=7;
      else getcommand:=0;
      end else getcommand:=0;
    until e.what<>evNothing;
  end;

begin
  getxy(x,y);
  if not canreadfromfile(h,page) then exit;
  nowpage:=1;
  repeat
    writehz(tt);
    com:=getCommand;
    case com of
    1..5:if com<=tt then begin
           e.what:=evKey;
           e.keycode:=ord(h[nowpage*10-10+com*2]);
           putevent(e);
           e.keycode:=ord(h[nowpage*10-10+com*2-1]);
           putevent(e);
           writeNothing;
           exit;
         end;
    6:if nowpage>1 then nowpage:=nowpage-1;
    7:if nowpage<page then nowpage:=nowpage+1;
    0: exit;
    end;
  until false;
end;

destructor TChineseInputBox.done;
begin
  disposestr(name);
  close(inputfile);
  dispose(savescreen,done);
  inherited done;
end;

{ Draw }

procedure np;
var m,n,r:longint;
    t,f,w:integer;
    q:byte;
begin
  if charsize=6 then begin
    for t:=1 to length(a) do begin
      m:=ord(a[t]);
      if (t<length(a)) and (m>$A0) and (ord(a[t+1])>$A0) THEN begin
        t:=t+1;
        n:=ord(a[t])-$A0;
        m:=m-$A0;
        r:=(m*94-94+n-1)*24+1140;
        seek(turbohzk,r);
        FOR f:=0 TO 11 do begin
          read(turbohzk,q);
          FOR w:=0 TO 7 do begin
            IF q MOD 2=1 THEN putpixel(x+t*6-5-w,y+f,c and $F) else if c>=16 then putpixel(x+t*6-5-w,y+f,c shr 4);
            q:=q div 2;
          end;
          read(turbohzk,q);
          q:=q shr 4;
          FOR w:=4 TO 7 do begin
            IF q MOD 2=1 THEN putpixel(x+t*6+3-w,y+f,c and $F) else if c>=16 then putpixel(x+t*6+3-w,y+f,c shr 4);
            q:=q div 2;
          end;
        end;
      end ELSE if m in [32..126] then begin
        r:=(m-32)*12;
        SEEK(turbohzk,r);
        FOR f:=0 TO 11 do begin
          read(turbohzk,q);
          q:=q shr 2;
          FOR w:=0 TO 5 do begin
            IF q MOD 2 = 1 THEN putpixel(x+t*6-1-w,y+f,c and $F) else if c>=16 then putpixel(x+t*6-1-w,y+f,c shr 4);
            q:=q div 2;
          end;
        end;
      end;
    end;
  end else begin
    for t:=1 to length(a) do begin
      m:=ord(a[t]);
      if (t<length(a)) and (m>$A0) and (ord(a[t+1])>$A0) THEN begin
        t:=t+1;
        n:=ord(a[t])-$A0;
        m:=m-$A0;
        r:=(m*94-94+n-1)*32+4096;
        seek(turbohzk,r);
        FOR f:=0 TO 15 do begin
          read(turbohzk,q);
          FOR w:=0 TO 7 do begin
            IF q MOD 2=1 THEN putpixel(x+t*8-9-w,y+f,c and $F) else if c>=16 then putpixel(x+t*8-9-w,y+f,c shr 4);
            q:=q div 2;
          end;
          read(turbohzk,q);
          FOR w:=0 TO 7 do begin
            IF q MOD 2=1 THEN putpixel(x+t*8-1-w,y+f,c and $F) else if c>=16 then putpixel(x+t*8-1-w,y+f,c shr 4);
            q:=q div 2;
          end;
        end;
      end ELSE if m in [32..126] then begin
        r:=m*16;
        SEEK(turbohzk,r);
        FOR f:=0 TO 15 do begin
          read(turbohzk,q);
          FOR w:=0 TO 7 do begin
            IF q MOD 2 = 1 THEN putpixel(x+t*8-1-w,y+f,c and $F) else if c>=16 then putpixel(x+t*8-1-w,y+f,c shr 4);
            q:=q div 2;
          end;
        end;
      end;
    end;
  end;
end;

procedure npLabel;
var name,red:boolean;
    t,tt:integer;
    color:integer;
    n:string;
begin
  red:=false;
  name:=false;
  tt:=0;
  for t:=1 to length(a) do begin
    case a[t] of
    '$':if name then begin
          drawicon(n,x+tt,y);
          name:=false;
          tt:=tt+16-charsize;
        end else begin
          name:=true;
          n:='';
          tt:=tt-charsize;
        end;
    '~':if not name then begin
          red:=not red;
          tt:=tt-charsize;
        end else begin
          n:=n+'~';
          tt:=tt-charsize;
        end;
    else if name then begin
         n:=n+a[t];
         tt:=tt-charsize;
       end else begin
         if red then color:=c2 else color:=c1;
         if (t<length(a)) and (a[t]>#$A0) and (a[t+1]>#$A0) then begin
           np(a[t]+a[t+1],x+tt,y,color);
           t:=t+1;
           tt:=tt+charsize;
         end else np(a[t],x+tt,y,color);
       end;
    end;
    tt:=tt+charsize;
  end;
end;

procedure npin;
begin
  if length(a)>l then np(copy(a,1,l),x,y,c) else np(a+longstr(' ',l-length(a)),x,y,c);
end;

procedure drawicon;
var f:file of byte;
    d,c:byte;
    t:longint;
    s:string;
    tt:integer;
begin
  s:='';
  for t:=1 to length(n) do s:=s+upcase(n[t]);
  n:=s;
  mhide;
  if n<>'' then begin
    s:='';
    if ICGName<>'' then begin
      assign(f,findfile(icgname));
      {$I-}
      reset(f);
      {$I+}
      if ioresult=0 then begin
        for t:=1 to sizeoffile(findfile(icgname)) div 141 do begin
          seek(f,t*141-141);
          s:='';
          for tt:=1 to 12 do begin read(f,c);s:=s+chr(c) end;
          if noblank(s)=n then begin
            read(f,d);
            for t:=0 to 127 do if not eof(f) then begin
              read(f,c);
              if c div 16<>d then putpixel(x+(t mod 8)*2,y+(t div 8),c div 16);
              if c mod 16<>d then putpixel(x+(t mod 8)*2+1,y+(t div 8),c mod 16);
            end;
            close(f);
            mshow;
            exit;
          end;
        end;
        close(f);
      end;
    end;
    assign(f,findfile(n));
    {$I-}
    reset(f);
    {$I+}
    if ioresult=0 then begin
      read(f,d);
      for t:=0 to 127 do if not eof(f) then begin
        read(f,c);
        if c div 16<>d then putpixel(x+(t mod 8)*2,y+(t div 8),c div 16);
        if c mod 16<>d then putpixel(x+(t mod 8)*2+1,y+(t div 8),c mod 16);
      end;
      close(f);
    end;
  end;
  mshow
end;

{ Basic IO }

procedure VGA; external;
  {$L EGAVGA.OBJ }

procedure InitAll;
  function IGraph:boolean;
  var gd,gm:integer;
  begin
    iGraph:=true;
    if RegisterBGIdriver(@VGA)<0 then begin
      IGraph:=false;
      writeln('Cannot initialize Graph system. Error 1');
    end;
    gd:=detect;
    initgraph(gd,gm,'');
    if GraphResult<>grOk then begin
      IGraph:=false;
      writeln('Cannot initialize Graph system. Error 1');
    end;
  end;

  function IChinese:Boolean;
  var r:TRect;
  begin
    if charsize=6 then begin
      assign(turbohzk,findfile('TURBOHZ2'));
    end
    else begin
      assign(turbohzk,findfile('TURBOHZ1'));
    end;
    {$I-}
      reset(turbohzk);
    {$I+}
    if ioresult<>0 then begin
      iChinese:=false;
      if charsize=6 then writeln('Cannot initialize Chinese system. TURBOHZ2 not found. Error 2')
      else writeln('Cannot initialize Chinese system. TURBOHZ1 not found. Error 2')
    end else iChinese:=true;
    r.assign(100,460,0,0,0);
    chineseinputbox:=new(PChineseInputBox,init(R,'py.mb','全拼',kbAltF2));
    chinese2:=chineseinputbox;
  end;

  procedure iEvent;
  begin
    TempEvent:=nil;
    disabledcommand:=[];
  end;

begin
  if littlechar then charsize:=6 else charsize:=8;
  if not InitMouse then begin
    writeln('Cannot find mouse driver. Error 3.');
    halt(3);
  end;
  if not iChinese then halt(2);
  if not iGraph then halt(1);
  iEvent;
  Finish:=false;
  mshow;
end;

procedure CloseAll;
begin
  mhide;
  close(turbohzk);
  if chineseinputbox<>nil then dispose(chineseinputbox,done);
  closegraph;
end;

procedure disablecommand;
begin
  disabledcommand:=disabledcommand+d;
end;

procedure enablecommand;
begin
  disabledcommand:=disabledcommand-d;
end;

procedure disablechineseinput;
begin
  if (chineseinputbox<>nil) and chineseinputbox^.active then begin
    chineseinputbox^.active:=false;
    chineseinputbox^.draw;
  end;
  chineseinputbox:=nil;
end;

procedure enablechineseinput;
begin
  chineseinputbox:=chinese2;
end;

{ Event }

procedure PutEvent;
var head:PEventLink;
begin
  if TempEvent=nil then begin
    new(TempEvent);
    TempEvent^.ThisEvent:=event;
    TempEvent^.next:=nil;
  end else begin
    new(head);
    head^.ThisEvent:=event;
    head^.next:=TempEvent;
    TempEvent:=head;
  end;
end;

procedure GetMouseEvent;
var r:registers;
begin
  r.ax:=3;
  intr($33,r);
  event.where.x:=r.cx;
  event.where.y:=r.dx;
  if r.bx>0 then begin
    event.what:=evMouse;
    event.button:=r.bx;
  end else event.what:=evNothing;
end;

procedure SetMousePosition(x,y:integer);
var r:Registers;
begin
  r.ax:=4;
  r.cx:=x;
  r.dx:=y;
  intr($33,r);
end;

procedure GetMousePosition(var x,y:integer);
var r:Registers;
begin
  r.ax:=3;
  intr($33,r);
  x:=r.cx;
  y:=r.dx;
end;

procedure SetMouseTo(x,y:integer);
var a,b:integer;
begin
  MHide;
  GetMousePosition(a,b);
  SetMousePosition(a+x,b+y);
  MShow;
end;

procedure GetEvent;
var c:char;
begin
  event.what:=evNothing;
  event.ptr:=nil;
  if TempEvent<>nil then begin
    event:=TempEvent^.ThisEvent;
    TempEvent:=TempEvent^.next;
    if enablechinese and chineseinputbox^.valid then chineseinputbox^.handleevent(event);
  end else begin
    GetMouseEvent(event);
    if (event.what=evNothing) and keypressed then begin
      c:=readkey;
      event.what:=evKey;
      if c>#0 then event.KeyCode:=ord(c) else event.KeyCode:=256+ord(readkey);
      if enablechinese and chineseinputbox^.valid then chineseinputbox^.handleevent(event);
    end;
  end;
  if EnableMouseKey and (event.what=evKey) then case event.KeyCode of
  kbUp:
    begin
      SetMouseTo(0,-1);
      clearevent(event);
    end;
  kbDown:
    begin
      SetMouseTo(0,1);
      clearevent(event);
    end;
  kbLeft:
    begin
      SetMouseTo(-1,0);
      clearevent(event);
    end;
  kbRight:
    begin
      SetMouseTo(1,0);
      clearevent(event);
    end;
  end;
end;

procedure ClearEvent;
begin
  event.command:=cmNoCommand;
  event.what:=evNothing;
end;

function Message;
var event:TEvent;
begin
  message:=false;
  if p^.valid and p^.CanReceiveMessage then begin
    event.what:=evCommand;
    event.command:=command;
    event.ptr:=ptr;
    p^.handleevent(event);
    if event.what=evNothing then message:=true;
  end;
end;

{ Other }

procedure GetRect;
var x0,y0,x,y:integer;
    e:TEvent;
begin
  repeat GetMouseEvent(e) until e.what=evMouse;
  x0:=e.where.x;
  y0:=e.where.y;
  x:=e.where.x;
  y:=e.where.y;
  PSetBoxXor(x0,y0,x,y);
  repeat
    if (e.where.x<>x) or (e.where.y<>y) then begin
      PSetBoxXor(x0,y0,x,y);
      x:=e.where.x;
      y:=e.where.y;
      PSetBoxXor(x0,y0,x,y);
    end;
    GetMouseEvent(e);
  until e.what=evNothing;
  PSetBoxXor(x0,y0,x,y);
  r.assign(min(x0,x),min(y0,y),max(x0,x),max(y0,y),0);
end;

procedure GetRectTo;
var x0,y0,x1,y1,x2,y2:integer;
    e:TEvent;
begin
  PSetBoxXor(r.a.x,r.a.y,r.a.x+r.b.x,r.a.y+r.b.y);
  GetMouseEvent(e);
  x0:=e.where.x;
  y0:=e.where.y;
  repeat
    if (x0<>e.where.x) or (y0<>e.where.y) then begin
      PSetBoxXor(r.a.x,r.a.y,r.a.x+r.b.x,r.a.y+r.b.y);
      r.Move(e.where.x-x0,e.where.y-y0);
      x0:=e.where.x;
      y0:=e.where.y;
      PSetBoxXor(r.a.x,r.a.y,r.a.x+r.b.x,r.a.y+r.b.y);
    end;
    GetMouseEvent(e)
  until e.what=evNothing;
  PSetBoxXor(r.a.x,r.a.y,r.a.x+r.b.x,r.a.y+r.b.y);
end;

function lenlabel;
var l,t:integer;
    name:boolean;
begin
  l:=0;
  name:=false;
  for t:=1 to length(a) do case a[t] of
  '$':begin if name then l:=l+16;name:=not name end;
  '~':;
  else if not name then l:=l+charsize;
  end;
  lenlabel:=l;
end;

function mousein;
var x,y:integer;
begin
  if p<>nil then begin
    p^.getxy(x,y);
    with p^.bouns do mousein:=(o.x>x+t) and (o.x<x+b.x-t) and (o.y>y+t) and (o.y<y+b.y-t);
  end else mousein:=false;
end;

function copylabel;
var b:string;
    t:integer;
begin
  for t:=length(a) downto 0 do if lenlabel(copy(a,1,t))<=p then break;
  copylabel:=copy(a,1,t);
end;


end.
