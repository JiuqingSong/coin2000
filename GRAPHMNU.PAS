{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Menu Items                       }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

unit GraphMnu;

interface

uses CrtA,Graph,GraphObj,GraphDrv,GraphCon,GraphCrt;

type

  PMenuItem=^TMenuItem;
  TMenuItem=record
    caption:PString;
    command:word;
    ptr:PObject;
    next:PMenuItem;
  end;

  PMenu=^TMenu;
  TMenu=object(TGroup)
    SaveScreen:PSaveScreen;
    now,item:PMenuItem;
    prevmenu,nextmenu:PMenu;
    title:PString;
    constructor init(R:TRect;c:integer;t:string;i:PMenuItem);
    procedure handleevent(var Event:TEvent);virtual;
    procedure Execute;
    procedure Draw;virtual;
    procedure WriteItem;
    procedure IncNow;
    procedure DecNow;
    destructor done;virtual;
  end;

  PMenuBar=^TMenuBar;
  TMenuBar=object(TToolBar)
    menu:PMenu;
    firstbutton,lastbutton:PToolButton;
    constructor init(R:TRect;c:integer;m:PMenu);
    procedure insert(p:PObject);virtual;
    procedure HandleEvent(var event:TEvent);virtual;
  end;

  PList=^TList;
  TList=object(TGroup)
    menu:PMenu;
    button:PButton;
    TheLabel:PLabel;
    constructor init(R:TRect;c:integer;m:PMenuItem);
    procedure draw;virtual;
    procedure handleevent(var event:TEvent);virtual;
    function GetSeek:integer;
    function GetCaption:String;
  end;

  PPage=^TPage;
  TPage=object(TGroup)
    caption:PString;
    nextpage:PPage;
    left:integer;
    constructor init(c:integer;a:string);
    procedure handleevent(var event:TEvent);virtual;
    procedure draw;virtual;
    function mouseon(p:TPoint):Boolean;virtual;
    destructor done;virtual;
  end;

  PPageGroup=^TPageGroup;
  TPageGroup=object(TGroup)
    page:PPage;
    constructor init(r:TRect;c:integer);
    procedure insert(p:PObject);virtual;
    procedure InsertPage(p:PPage);
    procedure handleevent(var event:TEvent);virtual;
  end;

  function NewItem(a:string;cm:word;pt:PObject;next:PMenuItem):PMenuItem;
  function NewList(a:string;next:PMenuItem):PMenuItem;
  function NewMenu(t:string;item:PMenuItem;nextmenu:PMenu):PMenu;

implementation

function NewItem;
var p:PMenuItem;
begin
  new(p);
  p^.caption:=newstr(a);
  p^.command:=cm;
  p^.ptr:=pt;
  p^.next:=next;
  NewItem:=p;
end;

function NewList;
var p:PMenuItem;
begin
  new(p);
  p^.caption:=newstr(a);
  p^.command:=cmNoCommand;
  p^.ptr:=nil;
  p^.next:=next;
  NewList:=p;
end;

function NewMenu;
var p:PMenu;
    r:TRect;
begin
  r.assign(0,0,0,0,2);
  p:=new(PMenu,init(r,$70,t,item));
  p^.NextMenu:=NextMenu;
  p^.PrevMenu:=nil;
  if nextmenu<>nil then nextmenu^.prevmenu:=p;
  NewMenu:=p;
end;

{ TMenu }

constructor TMenu.init;
var p:PMenuItem;
    line:integer;
begin
  TGroup.init(R,c);
  bouns.b.x:=0;
  item:=i;
  now:=item;
  nextmenu:=nil;
  if t='' then t:=' ';
  title:=newstr(t);
  p:=item;
  line:=0;
  while p<>nil do begin
    if lenstr(p^.caption)>bouns.b.x then bouns.b.x:=lenstr(p^.caption);
    p:=p^.next;
    inc(line);
  end;
  bouns.b.x:=bouns.b.x*charsize;
  bouns.b.y:=line*2*charsize;
  savescreen:=new(PSaveScreen,init(bouns));
  insert(savescreen);
  active:=false;
  valid:=item<>nil;
end;

procedure TMenu.HandleEvent;
begin
  inherited handleevent(event);
  if (event.what=evCommand) and (event.Ptr=@Self) and (event.command=cmExecute) then execute;
end;

procedure TMenu.IncNow;
begin
  now:=now^.next;
  if now=nil then now:=item;
end;

procedure TMenu.DecNow;
var p:PMenuItem;
begin
  p:=now;
  if p=item then p:=nil;
  repeat incnow until now^.next=p;
end;

procedure TMenu.Execute;
var e:TEvent;
    CanQuit:boolean;
    p:PMenuItem;
    x,y,l,t:integer;
begin
  if active then exit;
  canquit:=false;
  savescreen^.save;
  active:=true;
  draw;
  repeat
    getevent(e,false);
    case e.what of
    evKey:case e.keycode of
          kbUp      :begin
                       DecNow;
                       writeitem;
                     end;
          kbDown    :begin
                       IncNow;
                       writeitem;
                     end;
          kbLeft:    if owner<>nil then begin
                       e.what:=evCommand;
                       if prevmenu<>nil then begin
                         e.ptr:=prevmenu;
                         e.command:=cmExecute;
                       end else begin
                         e.ptr:=owner;
                         e.command:=cmMenuLeft;
                       end;
                       putevent(e);
                       CanQuit:=true
                     end;
          kbRight:   if owner<>nil then begin
                       e.what:=evCommand;
                       if nextmenu<>nil then begin
                         e.ptr:=nextmenu;
                         e.command:=cmExecute;
                       end else begin
                         e.ptr:=owner;
                         e.command:=cmMenuRight;
                       end;
                       putevent(e);
                       CanQuit:=true
                     end;
          kbEsc     :CanQuit:=true;
          kbEnter   :begin
                       e.what:=evCommand;
                       e.command:=now^.command;
                       e.ptr:=now^.ptr;
                       putevent(e);
                       canquit:=true;
                     end;
          end;
    evMouse:if mouseon(e.where) then begin
              repeat
                if mouseon(e.where) then begin
                  p:=item;
                  getxy(x,y);
                  l:=(e.where.y-y) div (charsize*2);
                  for t:=1 to l do if p^.next<>nil then p:=p^.next;
                  if p<>now then begin
                    now:=p;
                    writeitem;
                  end;
                end;
                getevent(e,false);
              until (e.what<>evMouse);
              if mouseon(e.where) then begin
                e.what:=evCommand;
                e.command:=now^.command;
                e.ptr:=now^.ptr;
                putevent(e);
                canquit:=true;
              end;
            end else canquit:=true;
    end;
  until canquit;
  savescreen^.writeout;
  active:=false;
  e.what:=evNothing;
  putevent(e);
end;

procedure TMenu.Draw;
var x,y:integer;
begin
  if not active then exit;
  getxy(x,y);
  mhide;
  with bouns do begin
    drawline(x,y,x+b.x,y+b.y,wide,15,8,color div 16);
    WriteItem;
  end;
  mshow;
end;

procedure TMenu.WriteItem;
var p:PMenuItem;
    l,x,y:integer;
begin
  p:=item;
  l:=0;
  getxy(x,y);
  mhide;
  with bouns do
    while p<>nil do begin
      if p^.caption<>nil then if p=now then np(p^.caption^,x,y+l*2*charsize,$F)
      else np(p^.caption^,x,y+l*2*charsize,color mod 16);
      p:=p^.next;
      inc(l);
    end;
  mshow;
end;

destructor TMenu.Done;
var p,r:PMenuItem;
begin
  p:=item;
  while p<>nil do begin
    r:=p;
    p:=p^.next;
    disposestr(r^.caption);
    dispose(r);
  end;
  inherited done;
end;

{ TList }

constructor TList.init;
var p:PMenuItem;
begin
  TGroup.init(r,c);
  p:=m;
  while p<>nil do begin
    p^.ptr:=@self;
    p^.command:=cmListChange;
    p:=p^.next;
  end;
  r.assign(0,bouns.b.y+2,0,0,2);
  menu:=new(PMenu,init(r,$70,'',m));
  insert(menu);
  r.assign(bouns.b.x-charsize*2,0,0,0,0);
  new(Button,init(r,'ми',cmListOpen,kbNoKey,@self));
  insert(button);
  if (m<>nil) and (m^.caption<>nil) then begin
    r.assign(0,0,bouns.b.x-charsize*2-1,bouns.b.y,0);
    TheLabel:=new(PLabel,init(r,c,m^.caption^));
    insert(TheLabel);
  end;
  active:=true;
  valid:=menu^.valid;
end;

procedure TList.Draw;
var x,y:integer;
begin
  getxy(x,y);
  mhide;
  with bouns do drawline(x,y,x+b.x,y+b.y,wide,8,15,-1);
  mshow;
end;

procedure TList.Handleevent;
begin
  inherited handleevent(event);
  if (event.what=evCommand) and (event.ptr=@self) then case event.command of
  cmListOpen:menu^.execute;
  cmListChange:if menu^.now^.caption<>nil then thelabel^.changeto(menu^.now^.caption^);
  end;
end;

function TList.GetSeek;
var p:PMenuItem;
    l:integer;
begin
  p:=menu^.item;
  l:=1;
  while p<>nil do begin
    if p^.caption^=thelabel^.caption^ then break;
    l:=l+1;
    p:=p^.next;
    if p=nil then l:=0;
  end;
  getseek:=l;
end;

function TList.GetCaption;
begin
  if thelabel^.caption<>nil then getcaption:=thelabel^.caption^ else getcaption:='';
end;

{ TMenuBar }

constructor TMenuBar.init;
var l:integer;
    re:TRect;
    p:PMenu;
    b:PToolButton;
begin
  TToolBar.init(r,c);
  l:=8;
  p:=m;
  while p<>nil do begin
    p^.bouns.a.x:=l;
    p^.bouns.a.y:=bouns.b.y+1;
    r.assign(0,0,0,0,2);
    new(b,init(r,color,p^.title^,'',cmExecute,p));
    TToolBar.insert(b);
    if l=8 then firstbutton:=b;
    l:=l+lenlabel(p^.title^)+6;
    p:=p^.nextmenu;
  end;
  lastbutton:=b;
  p:=m;
  while p<>nil do begin
    TGroup.insert(p);
    p:=p^.nextmenu;
  end;
end;

procedure TMenuBar.insert;
begin
  dispose(p,done);
end;

procedure TMenuBar.Handleevent;
begin
  inherited handleevent(event);
  if (event.what=evCommand) and (event.ptr=@self) then
    case event.command of
    cmMenuLeft:
      begin
        event.command:=lastbutton^.command;
        event.ptr:=lastbutton^.ptr;
        putevent(event);
        clearevent(event);
      end;
    cmMenuRight:
      begin
        event.command:=firstbutton^.command;
        event.ptr:=firstbutton^.ptr;
        putevent(event);
        clearevent(event);
      end;
    end;
end;

{ TPage }

constructor TPage.init;
var r:TRect;
begin
  r.assign(0,0,0,0,2);
  TGroup.init(r,c);
  if a='' then a:=' ';
  bouns.b.x:=length(a)*charsize;
  bouns.b.y:=2*charsize;
  nextpage:=nil;
  caption:=newstr(a);
  active:=false;
  valid:=true;
end;

procedure TPage.handleevent;
begin
  inherited handleevent(event);
  if (event.what=evMouse) and mouseon(event.where) then begin
    repeat getmouseevent(event) until (event.what=evNothing) or not mouseon(event.where);
    if (not active) and (event.what=evNothing) then begin
      message(owner,cmPageChange,@self);
      active:=true;
      draw;
      drawsub;
    end;
  end;
end;

function TPage.mouseon;
var x,y:integer;
begin
  getxy(x,y);
  with bouns do mouseon:=(p.x>=x+left) and (p.x<=x+b.x+left) and (p.y>=y) and (p.y<=y+b.y);
end;

procedure TPage.Draw;
var x,y:integer;
begin
  mhide;
  if owner<>nil then begin
    owner^.getxy(x,y);
    if active then with owner^.bouns do begin
      drawline(x,y,x+b.x,y+b.y,wide+1,0,0,-1);
      drawline(x,y,x+b.x,y+b.y,wide,15,8,owner^.color div 16)
    end;
  end;
  getxy(x,y);
  with bouns do begin
    drawline(x-wide+left-1,y-wide-1,x+wide+b.x+left+1,y+b.y,0,0,0,color div 16);
    drawline(x-wide+left,y-wide,x+b.x+wide+left,y+b.y,0,15,8,color div 16);
    setcolor(15);
    line(x-wide+left-1,y+b.y,x+wide+b.x+left+1,y+b.y);
    setcolor(0);
    if active then drawline(x-wide+left+1,y+b.y-1,x+b.x+wide+left-1,y+b.y,0,color div 16,color div 16,color div 16)
      else line(x-wide+left-1,y+b.y-1,x+wide+b.x+left+1,y+b.y-1);;
  end;
  if caption<>nil then np(caption^,x+left,y,color mod 16);
  mshow;
end;

destructor TPage.Done;
begin
  disposestr(caption);
  inherited done;
end;

{ TPageGroup }

constructor TPageGroup.init;
begin
  TGroup.init(r,c);
  page:=nil;
  active:=true;
end;

procedure TPageGroup.insert;
begin
  if p<>nil then dispose(p,done);
end;

procedure TPageGroup.insertPage;
begin
  if p^.valid then begin
    if sub=nil then p^.active:=true;
    p^.next:=sub;
    sub:=p;
    sub^.owner:=@self;
    p^.nextpage:=page;
    if page<>nil then with page^.bouns do p^.left:=page^.left+b.x+2*wide+4
      else p^.left:=p^.bouns.wide;
    p^.bouns.a.y:=-2*charsize-3;
    p^.bouns.b.y:=2*charsize+2;
    page:=p;
  end else dispose(p,done);
end;

procedure TPageGroup.handleevent;
var p:PPage;
begin
  inherited handleevent(event);
  if (event.what=evCommand) and (event.command=cmPageChange) then begin
    p:=page;
    while p<>nil do begin
      p^.active:=false;
      p:=p^.nextpage;
    end;
  end;
end;

end.