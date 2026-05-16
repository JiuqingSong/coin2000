{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Objects                          }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

Unit GraphObj;

Interface

Uses
  Graph, Crta, GraphDrv, GraphCon, GraphCrt;

type
  TValidChar = set of 28..255;
  TValidColor= set of 0..15;

const
  filenamechar:TValidChar=[65..90,97..122,48..57,46,92,58,45,95,35..37,64,126,$A0..$FF];

const barX=true;
      bary=false;

type
  PInputBox=^TInputBox;
  TInputBox=object(TObject)
    Active:boolean;
    MaxLong,LineLong:byte;
    Text:PString;
    ValidChar:TValidChar;
    constructor Init(R:TRect;m:byte;d:string;c:integer;v:TValidChar);
    procedure Draw;virtual;
    procedure WriteText;
    procedure HandleEvent(var event:TEvent);virtual;
    procedure ChangeTo(a:string);
    procedure Edit(var event:TEvent);
    function GetText:string;
    destructor Done;virtual;
  end;

  PLabel=^TLabel;
  TLabel=object(TObject)
    caption:PString;
    constructor init(R:TRect;c:integer;a:string);
    procedure draw;virtual;
    procedure ChangeTo(a:string);
    destructor done;virtual;
  end;

  PLabelX=^TLabelX;
  TLabelX=object(TLabel)
    procedure draw;virtual;
  end;

  PHotkey=^THotkey;
  THotkey=object(TObject)
    command,key:Word;
    constructor init(c,k:word);
    procedure HandleEvent(var event:TEvent);virtual;
  end;

  PButton=^TButton;
  TButton=object(TObject)
    command,key:word;
    caption:PString;
    pressed:Boolean;
    ptr:PObject;
    Delayed:byte;
    constructor init(r:TRect;c:string;co,k:word;p:PObject);
    procedure Draw;virtual;
    procedure SendCommand;virtual;
    procedure HandleEvent(var event:TEvent);virtual;
    destructor done;virtual;
  end;

  PNote=^TNote;
  TNote=object(TGroup)
    savescreen:PSavescreen;
    caption:PString;
    ptr:PObject;
    constructor init(c:string;p:PObject);
    procedure draw;virtual;
    procedure hide;virtual;
    procedure execute(var event:TEvent);
  end;

  PToolButton=^TToolButton;
  TToolButton=object(TButton)
    active:boolean;
    note:PNote;
    constructor init(r:TRect;c:integer;a,b:string;co:word;p:PObject);
    procedure Draw;virtual;
    procedure HandleEvent(var event:TEvent);virtual;
  end;

  PCheckBox=^TCheckBox;
  TCheckBox=object(TObject)
    Enabled:Boolean;
    key:word;
    caption:PString;
    constructor init(r:TRect;c:String;k:word;e:Boolean);
    procedure use;virtual;
    procedure draw;virtual;
    procedure HandleEvent(var event:TEvent);virtual;
    destructor done;virtual;
  end;

  PDesktop=^TDesktop;
  TDesktop=object(TGroup)
    constructor init(c:integer);
    procedure draw;virtual;
    procedure HandleEvent(var event:TEvent);virtual;
  end;

  PWindow=^TWindow;
  TWindow=object(TGroup)
    CloseButton:PButton;
    TheLabel:PLabel;
    constructor init(r:TRect;co:integer;c:string;ShowCloseButton:Boolean);
    procedure draw;virtual;
    procedure HandleEvent(var event:TEvent);virtual;
    procedure Execute;virtual;
  end;

  PDialogBox=^TDialogBox;
  TDialogBox=object(TWindow)
    SaveScreen:PSaveScreen;
    Result:word;
    constructor init(R:TRect;c:integer;a:string;ShowCloseButton:Boolean);
    procedure HandleEvent(var event:TEvent);virtual;
    procedure Execute;virtual;
    procedure UserEvent(var event:TEvent);virtual;
    function canQuit:Boolean;virtual;
  end;

  PChoice=^TChoice;
  TChoice=object(TObject)
    caption:PStrLink;
    total,selected:integer;
    constructor init(R:TRect;c:integer;de:integer;a:PStrLink);
    procedure Draw;virtual;
    procedure DrawSelect;
    procedure HandleEvent(var event:TEvent);virtual;
    destructor done;virtual;
  end;

  PBox=^TBox;
  TBox=object(TGroup)
    caption:PString;
    constructor init(R:TRect;c:integer;a:string);
    procedure draw;virtual;
    destructor done;virtual;
  end;

  PMoveBox=^TMoveBox;
  TMoveBox=object(TObject)
    vx,vy,lx,ly,minx,miny,maxx,maxy:longint;
    ptr:PObject;
    constructor init(R:TRect;c,aa,bb,vxx,vyy,aminx,aminy,amaxx,amaxy:integer;p:PObject);
    procedure draw;virtual;
    procedure drawblock(Display:Boolean);virtual;
    procedure MoveTo(x,y:integer);
    function realX:integer;
    function realY:integer;
    procedure HandleEvent(var event:TEvent);virtual;
  end;

  PMessageButton=^TMessageButton;
  TMessageButton=object(TButton)
    constructor init(r:TRect;c:string;co:word;p:PObject);
    procedure SendCommand;virtual;
    procedure Draw;virtual;
  end;

  PBar=^TBar;
  TBar=object(TGroup)
    Button1,Button2:PMessageButton;
    MoveBox:PMoveBox;
    isBarX:boolean;
    constructor init(r:TRect;i:boolean;c,amin,amax:longint;p:PObject);
    procedure draw;virtual;
    function GetValue:integer;
  end;

  PProgressBar=^TProgressBar;
  TProgressBar=object(TObject)
    value,max:longint;
    constructor init(r:TRect;c,v,m:integer);
    procedure draw;virtual;
    procedure DrawProgress;
    procedure handleevent(var event:TEvent);virtual;
    procedure go(v:longint);
    procedure go_to(v:longint);
  end;

  PNumBox=^TNumBox;
  TNumBox=object(TGroup)
    ButtonU,ButtonD:PMessageButton;
    Number:PInputBox;
    step,min,max,v:integer;
    constructor init(r:TRect;c,amin,amax,avalue,astep:integer);
    procedure handleevent(var Event:TEvent);virtual;
  end;

  PListBox=^TListBox;
  TListBox=object(TGroup)
    caption:PStrLink;
    bar:PBar;
    first,now,long:integer;
    ptr:PObject;
    constructor init(r:TRect;c:integer;a:PStrLink;aPtr:PObject);
    procedure ReInit(a:PStrLink);
    function GetCaption:string;
    procedure draw;virtual;
    procedure drawCaption;
    procedure handleevent(var event:TEvent);virtual;
    destructor done;virtual;
  end;

  PSlider=^TSlider;
  TSlider=object(TMoveBox)
    constructor init(r:TRect;c,amin,amax,av:integer;aptr:PObject);
    procedure draw;virtual;
    procedure drawBlock(display:boolean);virtual;
  end;

  PToolBar=^TToolBar;
  TToolbar=object(TGroup)
    constructor init(r:TRect;c:integer);
    procedure draw;virtual;
    procedure AddLine;
    procedure AddButton(c,n:string;cm:word;p:PObject);
    procedure insert(p:PObject);virtual;
  end;

  PToolLine=^TToolLine;
  TToolLine=object(TObject)
    constructor init(r:TRect);
    procedure draw;virtual;
  end;

  PLine=^TLine;
  TLine=object(TObject)
    procedure Draw;virtual;
  end;

  PColorTable=^TColorTable;
  TColorTable=object(TGroup)
    SaveScreen:PSaveScreen;
    Button:PButton;
    ValidColor:TValidColor;
    pan:PGroup;
    constructor init(r:TRect;c:integer;vc:TValidColor);
    procedure draw;virtual;
    procedure HandleEvent(var Event:TEvent);virtual;
    function GetColor:integer;
  end;

  PText=^TText;
  TText=object(TObject)
    caption:PString;
    Font,Size,shadow:integer;
    constructor init(s:string;c,x,y,afont,asize,w,ashadow:integer);
    procedure draw;virtual;
    destructor done;virtual;
  end;

function NewLabel(a:string;c,x,y:integer):PLabel;

implementation

{ TInputBox }

constructor TInputBox.init;
begin
  TObject.Init(R,c);
  maxlong:=m;
  if bouns.b.x div charsize-1>maxlong then linelong:=maxlong else linelong:=bouns.b.x div charsize-1;
  text:=newstr(d);
  validchar:=v;
  active:=false;
  valid:=maxlong>0;
end;

procedure TInputBox.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do begin
    drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,8,15,-1);
    drawline(x-wide+1,y-wide+1,x+b.x+wide-1,y+b.y+wide-1,0,0,7,color div 16);
    writetext;
  end;
  mshow;
end;

procedure TInputBox.WriteText;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  drawline(x,y,bouns.b.x+x,bouns.b.y+y,0,color div 16,color div 16,color div 16);
  if valid and (text<>nil) then
    if lenstr(text)<linelong then np(text^,x,y+bouns.b.y div 2-charsize,color mod 16)
    else np(copy(text^,lenstr(text)-linelong+1,linelong),x,y+bouns.b.y div 2-charsize,color mod 16);
  setcolor(0);
  if active then
    if lenstr(text)>linelong then
    line(x+linelong*charsize,y+bouns.b.y div 2+charsize,x+5+linelong*charsize,y+bouns.b.y div 2+charsize)
    else line(x+lenstr(text)*charsize,y+bouns.b.y div 2+charsize,x+5+lenstr(text)*charsize,y+bouns.b.y div 2+charsize);
  mshow;
end;

procedure TInputBox.ChangeTo;
begin
  disposestr(text);
  text:=newstr(a);
  writetext;
end;

procedure TInputBox.Handleevent;
begin
  inherited handleevent(event);
  if active then edit(event) else
  if (event.what=evMouse) and mouseon(event.where) then begin
    active:=true;
    edit(event);
  end;
end;

procedure TInputBox.edit;
begin
  writetext;
  repeat;
    case event.what of
    evKey:case event.KeyCode of
      28..255:if (event.keycode in ValidChar) and (lenstr(text)<maxlong) then AddStr(text,chr(event.keycode));
      8:      if text<>nil then DeleteStr(text,lenstr(text),1);
      3:      DeleteStr(text,1,lenstr(text));
      13,27:  active:=false;
      end;
    evMouse:if not mouseon(event.where) then begin
      active:=false;
      clearevent(event);
      end else clearevent(event);
    end;
    if event.what<>evNothing then writetext;
    if active then getevent(event,true);
  until not active;
  writetext;
  if (event.what=evkey) and (event.keycode=kbEnter) then putevent(event);
end;

function TInputBox.GetText;
begin
  if text=nil then gettext:='' else gettext:=text^;
end;

destructor TInputBox.done;
begin
  disposestr(text);
  inherited done;
end;

{ Tlabel }

constructor TLabel.Init;
begin
  TObject.init(R,c);
  caption:=newstr(a);
  if caption=nil then caption:=newstr(' ');
  valid:=caption<>nil;
end;

procedure TLabel.Draw;
var x,y,c:integer;
begin
  getxy(x,y);
  mhide;
  if owner<>nil then c:=owner^.color div 16 else c:=7;
  if color div 16>0 then c:=color div 16;
  if valid then with bouns do begin
    if wide>0 then drawline(x,y,b.x+x,b.y+y,wide,15,8,c) else drawline(x,y,b.x+x,b.y+y,wide,c,c,c);
    nplabel(copylabel(caption^,b.x),x,y,color mod 16,4);
  end;
  mshow;
end;

procedure TLabel.ChangeTo;
begin
  if a='' then a:=' ';
  if a<>caption^ then begin
    disposestr(caption);
    caption:=newstr(a);
    draw;
  end;
end;

destructor TLabel.done;
begin
  disposestr(caption);
  inherited done;
end;

{ TLabelX }

procedure TLabelX.draw;
var t,x0,y0,x,y,c:integer;
begin
  mhide;
  getxy(x0,y0);
  x:=x0;
  y:=y0;
  if owner<>nil then c:=owner^.color div 16 else c:=7;
  if color div 16>0 then c:=color div 16;
  with bouns do if wide>0 then drawline(x,y,x+b.x,y+b.y,wide,8,15,c)
  else drawline(x,y,x+b.x,y+b.y,wide,c,c,c);
  for t:=1 to lenstr(caption) do begin
    if x-x0>bouns.b.x-charsize then begin x:=x0;y:=y+2*charsize end;
    if y-y0>bouns.b.y-2*charsize then break;
    if (t<lenstr(caption)) and (caption^[t]>#$A0) and (caption^[t+1]>#$A0) then begin
      if x+2*charsize-x0<=bouns.b.x then begin
        np(caption^[t]+caption^[t+1],x,y,color);
        x:=x+charsize;
        t:=t+1;
      end else begin
        x:=x0-charsize;
        y:=y+2*charsize;
        t:=t-1;
      end;
    end else np(caption^[t],x,y,color);
    x:=x+charsize;
  end;
  mshow;
end;

{ THotKey }

constructor THotKey.Init;
var R:TRect;
begin
  R.Assign(0,0,0,0,0);
  TObject.Init(r,0);
  command:=c;
  key:=k;
  if (command=0) or (key=0) then valid:=false;
end;

procedure THotkey.Handleevent;
var e:TEvent;
begin
  inherited handleevent(event);
  if event.what=evKey then
    if event.KeyCode=key then begin
      e.what:=evCommand;
      e.command:=command;
      PutEvent(e);
    end;
end;

{ TButton }

constructor TButton.init;
begin
  TObject.init(r,$70);
  bouns.b.x:=lenlabel(c);
  if pos('$',c)>0 then bouns.b.y:=16 else bouns.b.y:=2*charsize;
  caption:=newstr(c);
  command:=co;
  ptr:=p;
  key:=k;
  delayed:=0;
  pressed:=false;
  valid:=caption<>nil;
end;

procedure TButton.Draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  if not pressed then with bouns do begin
    drawline(x-wide,y-wide,x+b.x+wide-1,y+b.y+wide-1,0,15,8,7);
    setcolor(0);
    line(x-wide+1,y+b.y+wide,x+b.x+wide,y+b.y+wide);
    line(x+b.x+wide,y-wide+1,x+b.x+wide,y+b.y+wide);
    if valid then npLabel(caption^,x,y,0,4);
  end else with bouns do begin
    drawline(x+1-wide,y+1-wide,x+b.x+wide,y+b.y+wide,0,8,15,7);
    setcolor(0);
    line(x-wide,y-wide,x-wide,y+b.y+wide-1);
    line(x-wide,y-wide,x+b.x+wide-1,y-wide);
    if valid then npLabel(caption^,x+1,y+1,0,4);
  end;
  mshow;
end;

procedure TButton.HandleEvent;
var e:TEvent;
begin
  inherited handleevent(event);
  case event.what of
  evMouse:if mouseon(event.where) then begin
          GetMouseEvent(e);
          repeat
            if (not pressed) and mouseon(e.where) then begin
              pressed:=true;
              draw;
            end else if pressed and (not mouseon(e.where)) then begin
              pressed:=false;
              draw;
            end;
            if pressed then SendCommand;
            GetMouseEvent(e);
          until e.what<>evMouse;
          if pressed and (delayed=0) then begin
            e.what:=evCommand;
            e.command:=command;
            e.ptr:=ptr;
            PutEvent(e);
          end;
          if pressed then begin
            pressed:=false;
            draw;
          end;
          delayed:=0;
          end;
  evKey:if event.keycode=key then begin
            e.what:=evCommand;
            e.command:=command;
            e.ptr:=ptr;
            PutEvent(e);
        end;
  end;
end;

procedure TButton.SendCommand;
begin
end;

destructor TButton.done;
begin
  disposestr(caption);
  inherited done;
end;

{ TCheckBox }

constructor TCheckBox.init;
begin
  TObject.init(r,$70);
  bouns.b.x:=lenlabel(c)+2*charsize;
  bouns.b.y:=2*charsize;
  caption:=newstr(c);
  enabled:=e;
  key:=k;
  valid:=caption<>nil;
end;

procedure TCheckBox.use;
begin
end;

procedure TCheckBox.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  drawline(x,y,x+2*charsize-1,y+2*charsize-1,0,8,15,-1);
  drawline(x+1,y+1,x+2*charsize-2,y+2*charsize-2,0,0,7,15);
  if valid then npLabel(caption^,x+2*charsize,y,0,4);
  if enabled then np('',x,y,color mod 16);
  mshow;
end;

procedure TCheckBox.HandleEvent(var event:TEvent);
var e:TEvent;
begin
  inherited handleevent(event);
  case event.what of
  evMouse:if mouseon(event.where) then begin
            repeat
              GetMouseEvent(e);
            until e.what<>evMouse;
            if mouseon(e.where) then begin
              enabled:=not enabled;
              draw;
              use;
            end;
          end;
  evKey:if event.KeyCode=key then begin
          enabled:=not enabled;
          draw;
          use;
        end;
  end;
end;

destructor TCheckBox.done;
begin
  disposestr(caption);
  inherited done;
end;

{ TDeskTop }

constructor TDeskTop.Init;
var R:Trect;
begin
  R.Assign(0,0,639,479,0);
  TGroup.Init(R,c);
  active:=true;
end;

procedure TDeskTop.Draw;
var x,y:integer;
begin
 mhide;
 getxy(x,y);
 setfillstyle(1,color div 16);
 with bouns do bar(x,y,x+b.x,y+b.y);
 mshow;
end;

procedure TDeskTop.Handleevent;
begin
  inherited handleevent(event);
end;

{ TWindow }

constructor TWindow.init;
var rect:TRect;
begin
  TGroup.init(r,co);
  if showclosebutton then begin
    rect.assign(bouns.b.x-charsize*2,4-charsize div 2,0,0,3-charsize div 2);
    new(CloseButton,init(rect,'×',cmClose,kbAltF4,@self));
    insert(closebutton);
  end else closebutton:=nil;
  if showclosebutton then rect.assign(0,0,bouns.b.x-16,15,0)
  else rect.assign(0,0,bouns.b.x,15,0);
  new(TheLabel,init(rect,$10 or (color and $0F),c));
  insert(TheLabel);
end;

procedure TWindow.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  if active then with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,15,8,color div 16);
    setcolor(7);
    line(x-wide,y-wide,x+b.x+wide,y-wide);
    line(x-wide,y-wide,x-wide,y+b.y+wide);
    setcolor(0);
    line(x-wide,y+b.y+wide,x+b.x+wide,y+b.y+wide);
    line(x+b.x+wide,y-wide,x+b.x+wide,y+b.y+wide);
    drawline(x,y,x+b.x,y+15,0,1,1,1);
  end;
  mshow;
end;

procedure TWindow.HandleEvent;
begin
  if active then TGroup.handleevent(event) else TObject.handleevent(event);
  if (event.what=evCommand) and (event.command=cmExecute)
  and (event.ptr=@self) and not active then begin
    clearevent(event);
    execute;
  end;
end;

procedure TWindow.Execute;
begin
  if not active then begin
    active:=true;
    draw;
    drawsub;
  end;
end;

{ TDialogBox }

constructor TDialogBox.init;
begin
  TWindow.init(r,c,a,ShowCloseButton);
  result:=cmNoCommand;
  new(savescreen,init(r));
  insert(savescreen);
end;

procedure TDialogBox.Handleevent;
begin
  if not active then if next<>nil then next^.handleevent(event);
end;

procedure TDialogBox.UserEvent;
var r:TRect;
begin
  if (TheLabel<>nil) and (event.what=evMouse) and mousein(TheLabel,event.where,0) then begin
    r:=bouns;
    GetRectTo(r);
    if (r.a.x<>bouns.a.x) or (r.a.y<>bouns.a.y) then begin
      SaveScreen^.WriteOut;
      bouns:=r;
      SaveScreen^.bouns.assign(0,0,bouns.b.x,bouns.b.y,bouns.wide);
      SaveScreen^.Save;
      Draw;
      DrawSub;
    end;
  end;
end;

function TDialogBox.CanQuit;
begin
  canquit:=true;
end;

procedure TDialogBox.Execute;
var e:TEvent;
    s:string;
    r:TRect;
begin
  SaveScreen^.Save;
  Active:=true;
  Draw;
  DrawSub;
  repeat
    getevent(e,true);
    sub^.handleevent(e);
    userevent(e);
  until (e.what=evCommand) and (e.command and cmClose=cmClose) and canquit;
  Result:=lo(e.Command);
  clearevent(e);
  active:=false;
  SaveScreen^.WriteOut;
end;

{ TChoice }

constructor TChoice.init;
var p:PStrLink;
    long:integer;
begin
  TObject.init(R,c);
  p:=a;
  total:=0;
  long:=0;
  repeat
    if p<>nil then begin
      if lenstr(p^.data)>long then long:=lenstr(p^.data);
      p:=p^.next;
      total:=total+1;
    end;
  until p=nil;
  if de=0 then de:=1;
  if de>total then de:=total;
  selected:=de;
  caption:=a;
  bouns.b.x:=long*charsize+2*charsize;
  bouns.b.y:=total*2*charsize;
  valid:=total>0;
end;

procedure TChoice.Draw;
var x,y,t:integer;
    p:PStrLink;
begin
  mhide;
  getxy(x,y);
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,color div 16,color div 16,color div 16);
    p:=caption;
    for t:=1 to total do begin
      setfillstyle(1,15);
      setcolor(15);
      FillEllipse(x+charsize,y+t*2*charsize-charsize,6,6);
      setcolor(8);arc(x+charsize,y+t*2*charsize-charsize,45,224,6);
      setcolor(0);arc(x+charsize,y+t*2*charsize-charsize,45,224,5);
      setcolor(7);arc(x+charsize,y+t*2*charsize-charsize,225,44,5);
      if p^.data<>nil then np(p^.data^,x+2*charsize,y+t*2*charsize-2*charsize,color mod 16);
      p:=p^.next;
    end;
  end;
  drawselect;
  mshow;
end;

procedure TChoice.DrawSelect;
var t,x,y:integer;
begin
  mhide;
  getxy(x,y);
  for t:=1 to total do begin
    if t=selected then begin
      setfillstyle(1,0);
      setcolor(0);
    end else begin
      setfillstyle(1,15);
      setcolor(15);
    end;
    fillellipse(x+charsize,y+t*2*charsize-charsize,2,2)
  end;
  mshow;
end;

procedure TChoice.HandleEvent;
var x,y,s,t:integer;
begin
  inherited handleevent(event);
  if (event.what=evMouse) and mouseon(event.where) then begin
    getxy(x,y);
    s:=(event.where.y-y-1) div (2*charsize)+1;
    if s<>selected then begin
      selected:=s;
      DrawSelect;
    end;
    clearevent(event);
  end;
end;

destructor TChoice.done;
begin
  disposestrlink(caption);
  inherited done;
end;

{ TBox }

constructor TBox.init;
begin
  TGroup.init(R,c);
  caption:=newstr(a);
  active:=true;
  valid:=caption<>nil
end;

procedure TBox.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,0,color div 16,color div 16,color div 16);
    drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,8,15,-1);
    drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,-1,15,8,-1);
    if valid then np(caption^,x+2*charsize,y,color);
  end;
  mshow;
end;

destructor TBox.done;
begin
  disposestr(caption);
  inherited done;
end;

{ TMoveBox }

constructor TMoveBox.init;
begin
  TObject.init(r,c);
  MinX:=aminx;
  MaxX:=amaxx;
  miny:=aminy;
  maxy:=amaxy;
  lx:=aa;
  ly:=bb;
  vx:=validvalue(vxx,minx,maxx);
  vy:=validvalue(vyy,miny,maxy);
  ptr:=p;
  valid:=(lx>0) and (ly>0);
end;

procedure TMoveBox.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do drawline(x,y,x+b.x,y+b.y,wide,8,15,color div 16);
  DrawBlock(True);
  mshow;
end;

procedure TMoveBox.drawblock;
var x,y,mx,my:integer;
begin
  mhide;
  getxy(x,y);
  if display then drawline(x+realx,y+realy,x+realx+lx,y+realy+ly,0,15,8,color mod 16)
  else drawline(x+realx,y+realy,x+realx+lx,y+realy+ly,0,color div 16,color div 16,color div 16);
  mshow;
end;

function TMoveBox.RealX;
var mx:integer;
begin
  if maxx=minx then mx:=minx+1 else mx:=maxx;
  with bouns do realx:=((vx-minx)*(b.x-lx)) div (mx-minx);
end;

function TMoveBox.RealY;
var my:integer;
begin
  if maxy=miny then my:=miny+1 else my:=maxy;
  with bouns do realy:=((vy-miny)*(b.y-ly)) div (my-miny);
end;

procedure TMoveBox.MoveTo;
begin
  if (x<>0) or (y<>0) then begin
    drawblock(false);
    if x>0 then if vx+x<=maxx then vx:=vx+x else vx:=maxx;
    if x<0 then if vx+x>=minx then vx:=vx+x else vx:=minx;
    if y>0 then if vy+y<=maxy then vy:=vy+y else vy:=maxy;
    if y<0 then if vy+y>=miny then vy:=vy+y else vy:=miny;
    drawblock(true);
    message(ptr,cmMoveBoxChange,ptr);
  end;
end;

procedure TMoveBox.HandleEvent;
var a,b,x,y,c,d:integer;
    e:TEvent;
begin
  inherited handleevent(event);
  if event.what<>evNothing then
  case event.what of
  evCommand:
    if event.ptr=@self then begin
      case event.command of
      cmMoveBoxUp:   moveto(0,-1);
      cmMoveBoxDown: moveto(0,1);
      cmMoveBoxLeft: moveto(-1,0);
      cmMoveBoxRight:moveto(1,0);
      end;
      clearevent(event);
    end;
  evMouse:
    if mouseon(event.where) then begin
      if lx=bouns.b.x then a:=1 else a:=bouns.b.x-lx+1;
      if ly=bouns.b.y then b:=1 else b:=bouns.b.y-ly+1;
      getxy(x,y);
      if (event.where.x>=x+realx) and (event.where.x<=x+realx+lx) and
         (event.where.y>=y+realy) and (event.where.y<=y+realy+ly) then begin
        c:=event.where.x;
        d:=event.where.y;
        repeat
          getevent(e,false);
          if (e.where.x<>c) or (e.where.y<>d) then begin
            moveto(((e.where.x-x-lx div 2)*(maxx-minx+1) div a)-vx+minx,
                   ((e.where.y-y-ly div 2)*(maxy-miny+1) div b)-vy+miny);
            c:=e.where.x;
            d:=e.where.y;
          end;
        until e.what=evNothing;
      end else begin
        if event.where.x-(x+realx+(lx div 2))<0 then moveto(-1,0);
        if event.where.x-(x+realx+(ly div 2))>0 then moveto(1,0);
        if event.where.y-(y+realy+(lx div 2))<0 then moveto(0,-1);
        if event.where.y-(y+realy+(ly div 2))>0 then moveto(0,1);
      end;
    end;
  end;
end;

{ TMessageButton }

constructor TMessageButton.init;
begin
  TObject.init(r,$70);
  caption:=newstr(c);
  command:=co;
  ptr:=p;
  key:=kbNoKey;
  delayed:=0;
  pressed:=false;
  valid:=caption<>nil;
end;

procedure TMessageButton.SendCommand;
begin
  message(ptr,command,ptr);
  delay(150-delayed*148);
  delayed:=1;
end;

procedure TMessageButton.Draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  if not pressed then with bouns do begin
    drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,15,8,7);
    if valid then np(caption^,x+(b.x-lenstr(caption)*charsize) div 2,y+(b.y-2*charsize) div 2,0);
  end else with bouns do begin
    drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,8,15,7);
    if valid then np(caption^,x+1+(b.x-lenstr(caption)*charsize) div 2,y+1+(b.y-2*charsize) div 2,0);
  end;
  mshow;
end;

{ TBar }

constructor TBar.init;
var re:TRect;
begin
  TGroup.init(r,0);
  isbarX:=i;
  if isbarx then begin
    bouns.b.y:=16;
    re.assign(17,1,bouns.b.x-17,bouns.b.y-1,1);
    new(MoveBox,init(re,c,14,bouns.b.y-2,amin,0,amin,0,amax,0,p));
    re.assign(1,1,14,bouns.b.y-1,0);
    new(Button1,init(re,'',cmMoveBoxLeft,MoveBox));
    re.assign(bouns.b.x-14,1,bouns.b.x-1,bouns.b.y-1,0);
    new(Button2,init(re,'',cmMoveBoxRight,MoveBox));
  end else begin
    bouns.b.x:=16;
    re.assign(1,17,bouns.b.x-1,bouns.b.y-17,1);
    new(MoveBox,init(re,c,bouns.b.x-2,14,0,amin,0,amin,0,amax,p));;
    re.assign(1,1,bouns.b.x-1,14,0);
    new(Button1,init(re,'',cmMoveBoxUp,MoveBox));
    re.assign(1,bouns.b.y-14,bouns.b.x-1,bouns.b.y-1,0);
    new(Button2,init(re,'',cmMoveBoxDown,MoveBox));
  end;
  insert(MoveBox);
  insert(Button1);
  insert(Button2);
  active:=true;
  valid:=MoveBox^.valid and Button1^.valid and Button2^.valid;
end;

procedure TBar.draw;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do if isbarx then begin
    drawline(x,y,x+15,y+b.y,0,8,15,-1);
    drawline(x+b.x-15,y,x+b.x,y+b.y,0,8,15,-1);
  end else begin
    drawline(x,y,x+b.x,y+15,0,8,15,-1);
    drawline(x,y+b.y-15,x+b.x,y+b.y,0,8,15,-1);
  end;
  mshow;
end;

function TBar.GetValue;
begin
  if isbarx then getvalue:=movebox^.vx else getvalue:=movebox^.vy;
end;

{ TProgressBar }

constructor TProgressBar.init;
begin
  TObject.init(R,c);
  value:=v;
  max:=m;
  valid:=m>0;
end;

procedure TProgressBar.draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,8,15,-1);
    drawline(x+1,y+1,x+b.x-1,y+b.y-1,0,0,7,color div 16);
    DrawProgress
  end;
  mshow;
end;

procedure TProgressBar.DrawProgress;
var p,x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do begin
    p:=trunc(value/max*(b.x-4));
    setcolor(color mod 16);
    setfillstyle(1,color mod 16);
    if p>0 then bar(x+2,y+2,x+p+2,y+b.y-2);
    setcolor(color div 16);
    setfillstyle(1,color div 16);
    if p<b.x-4 then bar(x+p+2,y+2,x+b.x-2,y+b.y-2);
  end;
  mshow;
end;

procedure TProgressBar.HandleEvent;
begin
  inherited handleevent(event);
  if (event.what=evCommand) and (event.ptr=@Self) then begin
    case event.command of
    cmProgressAdd:go(1);
    cmProgressMin:go(-1);
    end;
    clearevent(event);
  end;
end;

procedure TProgressBar.Go;
begin
  value:=validvalue(value+v,0,max);
  drawprogress;
end;

procedure TProgressBar.Go_To;
begin
  value:=validvalue(v,0,max);
  drawprogress
end;

{ TNumBox }

constructor TNumBox.init;
begin
  TGroup.init(r,0);
  min:=amin;
  max:=amax;
  v:=validvalue(avalue,min,max);
  if astep>0 then step:=astep else step:=1;
  r.assign(bouns.b.x-2*charsize+1,0,bouns.b.x,bouns.b.y div 2-2,2);
  new(buttonU,init(r,'',cmMoveBoxUp,@Self));
  r.assign(bouns.b.x-2*charsize+1,bouns.b.y div 2+3,bouns.b.x,bouns.b.y,2);
  new(buttonD,init(r,'',cmMoveBoxDown,@self));
  r.assign(0,0,bouns.b.x-2*charsize-4,bouns.b.y,2);
  new(number,init(r,(bouns.b.x-2*charsize-4) div charsize,stri(v),c,[45,48..57]));
  insert(buttonu);
  insert(buttond);
  insert(number);
  active:=true;
end;

procedure TNumBox.HandleEvent;
begin
  inherited handleevent(event);
  if (event.what=evCommand) and (event.ptr=@self) then begin
    case event.command of
    cmMoveBoxDown:
      begin
        if v-step>=min then v:=v-step else v:=min;
        number^.changeto(stri(v));
        event.what:=evCommand;
        event.command:=cmNumBoxChange;
        event.ptr:=nil;
        putevent(event);
      end;
    cmMoveBoxUp:
      begin
        if v+step<=max then v:=v+step else v:=max;
        number^.changeto(stri(v));
        event.what:=evCommand;
        event.command:=cmNumBoxChange;
        event.ptr:=nil;
        putevent(event);
      end;
    end;
  end;
  if value(number^.gettext)<>v then begin
    v:=validvalue(value(number^.gettext),min,max);
    number^.changeto(stri(v));
    number^.draw;
    event.what:=evCommand;
    event.command:=cmNumBoxChange;
    event.ptr:=nil;
    putevent(event);
  end;
end;

{ TListBox }

constructor TListBox.init;
var p:PStrLink;
begin
  TGroup.init(r,c);
  caption:=a;
  p:=caption;
  long:=0;
  while p<>nil do begin
    long:=long+1;
    p:=p^.next
  end;
  if long=0 then begin
    caption^.data:=newstr(' ');
    long:=1;
  end;
  r.assign(bouns.b.x-16,0,bouns.b.x,bouns.b.y,1);
  new(bar,init(r,barY,$77,1,long,@Self));
  insert(bar);
  now:=0;
  ptr:=aptr;
  active:=true;
  first:=1;
  valid:=bar^.valid;
end;

procedure TListBox.ReInit;
var p:PStrLink;
    t:integer;
begin
  p:=caption;
  disposestrlink(caption);
  caption:=a;
  p:=caption;
  long:=0;
  while p<>nil do begin
    long:=long+1;
    p:=p^.next
  end;
  if long=0 then begin
    caption^.data:=newstr(' ');
    long:=1;
  end;
  now:=0;
  first:=1;
  bar^.movebox^.maxy:=long;
  bar^.movebox^.vy:=1;
  draw;
  drawsub;
end;

procedure TListBox.Draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,8,15,-1);
    drawline(x,y,x+b.x-17,y+b.y,0,0,15,color div 16);
  end;
  now:=0;
  drawcaption;
  mshow;
end;

procedure TListBox.DrawCaption;
var t,x,y,h,v,a:integer;
    p:PStrLink;
begin
  v:=bar^.getvalue;
  if now=v then exit;
  h:=bouns.b.y div (2*charsize);
  if (v>=first) and (v<=first+h-1) then a:=first else
    if v<first then a:=v else a:=v-h+1;
  getxy(x,y);
  mhide;
  with bouns do drawline(x,y,x+b.x-17,y+b.y,0,0,15,color div 16);
  p:=caption;
  if a>0 then begin
    for t:=1 to a-1 do p:=p^.next;
    for t:=0 to h-1 do begin
      if (t+a<=long) and (p^.data<>nil) then if t+a=v then setcolor(15) else setcolor(color mod 16);
      if p<>nil then outtextxy(x+2,y+t*2*charsize+4,copy(p^.data^,1,(bouns.b.x-19) div charsize)) else break;
      p:=p^.next;
    end;
    first:=a;
  end else for t:=0 to long-1 do begin
    if p^.data<>nil then if t+1=v then npin(p^.data^,x+2,y+t*2*charsize,(bouns.b.x-19) div charsize,15)
    else npin(p^.data^,x+2,y+t*2*charsize,(bouns.b.x-19) div charsize,color mod 16);
    p:=p^.next;
    first:=1;
  end;
  mshow;
  now:=v;
end;

function TListBox.GetCaption;
var p:PStrlink;
    t:integer;
begin
  p:=caption;
  for t:=1 to bar^.getvalue-1 do p:=p^.next;
  if p^.data<>nil then getcaption:=p^.data^ else getcaption:='';
end;

procedure TListBox.HandleEvent;
var x,y,v:integer;
begin
  inherited handleevent(event);
  if event.what=evCommand then if (event.command=cmMoveBoxChange) and (event.ptr=@self) then drawcaption;
  if event.what=evMouse then if mouseon(event.where) then begin
    getxy(x,y);
    if (event.where.x<x+bouns.b.x-16) and ((event.where.y-y) div (2*charsize)<(bouns.b.y div (2*charsize))) then begin
      bar^.movebox^.drawblock(false);
      v:=(event.where.y-y) div (2*charsize)+first;
      if v>long then v:=long;
      bar^.movebox^.vy:=v;
      drawcaption;
      bar^.movebox^.drawblock(true);
      event.what:=evCommand;
      event.ptr:=ptr;
      event.command:=cmListBoxSelect;
      putevent(event);
      repeat getmouseevent(event) until event.what=evNothing;
    end;
    clearevent(event);
  end;
end;

destructor TListBox.Done;
begin
  disposestrlink(caption);
  inherited done;
end;

{ TSlider }

constructor TSlider.init;
begin
  TMoveBox.init(r,c,8,r.b.y-2,av,0,amin,0,amax,0,aptr);
end;

procedure TSlider.Draw;
var x,y,t,tt:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,0,color div 16,color div 16,color div 16);
    drawline(x,y+b.y div 2,x+b.x,y+1+b.y div 2,2,8,15,-1);
    setcolor(0);
    tt:=vx;
    if b.x>=maxx-minx then for t:=minx to maxx do begin
      vx:=t;
      line(x+realx+lx div 2,y+b.y-1,x+realx+lx div 2,y+b.y);
    end;
    vx:=tt;
  end;
  mshow;
  DrawBlock(True);
end;

procedure TSlider.DrawBlock;
var x,y:integer;
begin
  mhide;
  getxy(x,y);
  with bouns do if display then
    drawline(x+realx,y,x+realx+lx,y+b.y-2,0,15,8,color mod 16)
  else begin
    drawline(x+realx,y,x+realx+lx,y+b.y-2,0,color div 16,color div 16,color div 16);
    setcolor(8);
    line(x+realx,y-2+b.y div 2,x+realx+lx,y-2+b.y div 2);
    line(x+realx,y-1+b.y div 2,x+realx+lx,y-1+b.y div 2);
    setcolor(15);
    line(x+realx,y+2+b.y div 2,x+realx+lx,y+2+b.y div 2);
    line(x+realx,y+3+b.y div 2,x+realx+lx,y+3+b.y div 2);
  end;
  mshow;
end;

{ TToolBar }

constructor TToolbar.init;
begin
  TGroup.init(r,c);
  bouns.wide:=1;
  active:=true;
end;

procedure TToolbar.draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,8,15,color div 16);
    drawline(x,y,x+b.x,y+b.y,0,15,8,-1);
    drawline(x+2,y+2,x+4,y+b.y-2,0,15,8,-1);
  end;
  mshow;
end;

procedure TToolBar.AddLine;
var r:TRect;
    l:PToolLine;
begin
  r.assign(0,0,0,bouns.b.y+1,0);
  new(l,init(r));
  insert(l);
  l^.bouns.a.y:=0;
end;

procedure TToolBar.AddButton;
var r:TRect;
begin
  r.assign(0,0,0,0,2);
  insert(new(PToolButton,init(r,color,c,n,cm,p)));
end;

procedure TToolbar.insert;
var q:PObject;
    x:integer;
begin
  q:=sub;
  x:=6;
  while q<>nil do begin
    x:=x+q^.bouns.b.x+q^.bouns.wide*2+2;
    q:=q^.next;
  end;
  p^.bouns.a.x:=x+p^.bouns.wide;
  p^.bouns.a.y:=p^.bouns.wide+2;
  if p^.bouns.a.x+p^.bouns.b.x+2*bouns.wide<=bouns.b.x then inherited insert(p) else dispose(p,done);
end;

{ TToolButton }

constructor TToolButton.init;
begin
  TButton.init(r,a,co,kbNoKey,p);
  active:=false;
  new(note,init(b,@Self));
  color:=c;
end;

procedure TToolButton.Draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do begin
    drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,color div 16,color div 16,color div 16);
    if not active then if caption<>nil then nplabel(caption^,x+1,y+1,color,4);
    if active then
      if pressed then begin
        drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,8,15,-1);
        if caption<>nil then nplabel(caption^,x+1,y+1,color,4);
      end else begin
        drawline(x-wide,y-wide,x+b.x+wide,y+b.y+wide,0,15,8,-1);
        if caption<>nil then nplabel(caption^,x,y,color,4);
      end;
  end;
  mshow;
end;

procedure TToolButton.Handleevent;
var e:TEvent;
begin
  if mouseon(event.where) and (event.what<>evMouse) and (not active) then
  begin
    active:=true;
    draw;
    if note^.valid then note^.execute(event);
  end;
  if (not mouseon(event.where)) and active then begin
    active:=false;
    draw;
  end;
  if event.what=evMouse then if note^.valid then note^.hide;
  inherited handleevent(event);
end;

{ TToolLine }

constructor TToolLine.init;
begin
  TObject.init(r,0);
  bouns.b.x:=1;
end;

procedure TToolLine.draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do drawline(x,y,x+b.x,y+b.y,0,8,15,-1);
  mshow;
end;

{ TNote }

constructor TNote.init;
var r:TRect;
begin
  r.assign(0,0,length(c)*charsize,charsize*2,1);
  TGroup.init(r,$E0);
  new(savescreen,init(r));
  insert(savescreen);
  caption:=newstr(c);
  ptr:=p;
  active:=false;
  valid:=caption<>nil;
end;

procedure TNote.draw;
var e:TEvent;
begin
  if not active then begin
    mhide;
    active:=true;
    getmouseevent(e);
    bouns.a.x:=e.where.x+10;
    bouns.a.y:=e.where.y+15;
    savescreen^.save;
    with bouns do begin
      drawline(a.x,a.y,a.x+b.x,a.y+b.y,wide,0,0,color div 16);
      if valid then np(caption^,a.x,a.y,color mod 16);
    end;
    mshow;
  end;
end;

procedure TNote.Hide;
begin
  if active then begin
    savescreen^.writeout;
    active:=false;
  end;
end;

procedure TNote.Execute;
begin
  draw;
  repeat getevent(event,true) until (event.what<>evNothing) or not ptr^.mouseon(event.where);
  hide;
end;

{ TLine }

procedure TLine.Draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do drawline(x,y,x+b.x,y+b.y,wide,8,15,color div 16);
  mshow;
end;

{ TColorTable }
constructor TColorTable.init;
var re:TRect;
    t,tt:integer;
    b:PButton;
begin
  TGroup.init(r,c);
  re.assign(0,r.b.y,80,r.b.y+80,1);
  new(Pan,init(re,$70));
  insert(pan);
  new(SaveScreen,init(re));
  pan^.insert(SaveScreen);
  ValidColor:=vc;
  for t:=0 to 3 do for tt:=0 to 3 do if t*4+tt in validcolor then begin
    re.assign(tt*20+1,t*20+1,0,0,1);
    b:=new(PToolButton,init(re,(t*4+tt)*16,' ','第'+stri(t*4+tt)+'号颜色',cmColor0+t*4+tt,pan));
    Pan^.insert(b);
    b^.bouns.b.x:=17;
    b^.bouns.b.y:=17;
  end;
  re.assign(r.b.x-charsize*2,0,r.b.x,r.b.y-2,0);
  new(Button,init(re,'',cmColorTableOpen,kbNoKey,@self));
  insert(Button);
  valid:=true;
  active:=true;
end;

procedure TColorTable.draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  drawline(x,y,x+bouns.b.x,y+bouns.b.y,bouns.wide,8,15,color and 15);
  button^.draw;
  mshow;
end;

procedure TColorTable.HandleEvent;
var x,y:integer;
begin
  inherited handleevent(event);
  if (event.ptr=@self) and (event.what=evCommand) and (event.command=cmColorTableOpen) then begin
    SaveScreen^.Save;
    Pan^.Active:=True;
    Pan^.GetXY(x,y);
    mhide;
    With Pan^.Bouns do DrawLine(x,y,b.x+x,b.y+y,wide,15,8,pan^.color shr 4);
    mshow;
    Pan^.DrawAll;
    clearevent(event);
    repeat
      GetEvent(event,false);
      Pan^.HandleEvent(event);
      if (event.what=evCommand) and (event.ptr=Pan) then break;
    until (event.what=evMouse) and (not Pan^.MouseOn(Event.Where));
    if event.What=evMouse then repeat getevent(event,false) until event.What=evNothing
    else color:=event.command-cmColor0;
    Pan^.Active:=False;
    SaveScreen^.WriteOut;
    draw;
  end;
end;

function TColorTable.GetColor;
begin
  getcolor:=color and 15;
end;

{ TText }

constructor TText.init;
var r:TRect;
begin
  r.assign(x,y,x,y,w);
  TObject.init(r,c);
  font:=afont;
  size:=asize;
  if s='' then s:=' ';
  caption:=newstr(s);
  shadow:=ashadow;
  valid:=true;
end;

procedure TText.draw;
var x,y:integer;
begin
  getxy(x,y);
  if caption<>nil then begin
    if shadow>0 then writetext(caption^,font,8,x+shadow,y+shadow,size,bouns.wide);
    writetext(caption^,font,color,x,y,size,bouns.wide);
  end;
end;

destructor TText.done;
begin
  disposestr(caption);
  inherited done;
end;

{ Other }

function NewLabel;
var p:PLabel;
    r:TRect;
begin
  if a='' then a:=' ';
  r.assign(x,y,x+lenlabel(a),y+2*charsize-1,0);
  new(p,init(r,c,a));
  NewLabel:=p;
end;

end.