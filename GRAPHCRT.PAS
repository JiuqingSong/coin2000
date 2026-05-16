{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Functions                        }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

Unit GraphCrt;

interface

uses DOS,Graph;

type
  PString=^String;

  TPoint = record
    x,y:integer;
  end;

  PStrLink=^TStrLink;
  TStrLink=record
    Data:PString;
    next:PStrLink;
  end;

 { Mouse }
  procedure MouseDrive(a:word;var b,c,d:word);
  procedure mshow;
  procedure mhide;
  function InitMouse:boolean;
 { Draw }
  procedure WriteText(a:string;Font,color,x,y,size,wide:integer);
  procedure PSetBoxXor(x1,y1,x2,y2:integer);
  procedure drawline(x1,y1,x2,y2,wide,c1,c2,c3:integer);
 { PString }
  function NewStr(a:string):PString;
  function LenStr(a:PString):integer;
  function GetStrLink(a:string;next:PStrLink):PStrLink;
  procedure DisposeStr(a:PString);
  procedure AddStr(var a:PString;b:string);
  procedure DeleteStr(var a:PString;start,en:integer);
  procedure DisposeStrLink(var p:PStrLink);
  procedure SortStrLink(var head:PStrLink);
 { IO }
  function DriveValid(Drive: Char): Boolean;
  function existfile(filename:string):boolean;
  function sizeoffile(name:string):longint;
  function findfile(name:string):string;
  function GetExtName(name:string):string;
  function GetNameOnly(name:string):string;
  function GetFileNameDir(name:string):string;
 { Useful }
  function LongStr(a:char;l:integer):string;
  function max(a,b:integer):integer;
  function min(a,b:integer):integer;
  function stri(a:longint):string;
  function value(a:string):longint;
  function noblank(a:string):string;
  function ValidValue(v,min,max:longint):longint;

implementation

{ Mouse }

var mb,mx,my:word;

procedure MouseDrive;
var r:registers;
begin
  r.ax:=a;
  r.bx:=b;
  r.cx:=c;
  r.dx:=d;
  intr($33,r);
  b:=r.bx;
  c:=r.cx;
  d:=r.dx;
end;

function initmouse;
var r:registers;
begin
  r.ax:=0;
  intr($33,r);
  initmouse:=r.ax<>0
end;

procedure mshow;
begin
  mousedrive(1,mb,mx,my);
end;

procedure mhide;
begin
  mousedrive(2,mb,mx,my);
end;

{ Draw }

procedure WriteText;
var t,tt:integer;
    b:TextSettingsType;
begin
  mhide;
  gettextsettings(b);
  setcolor(color);
  settextstyle(font,0,size);
  for t:=0 to wide-1 do for tt:=0 to wide-1 do outtextxy(x+t,y+tt,a);
  settextstyle(b.font,b.direction,b.charsize);
  mshow;
end;

procedure PSetBoxXor;
var t:integer;
begin
  mhide;
  for t:=min(x1,x2) to max(x1,x2) do if t mod 2=0 then begin
    putpixel(t,y1,not getpixel(t,y1));
    putpixel(t,y2,not getpixel(t,y2));
  end;
  for t:=min(y1,y2) to max(y1,y2) do if t mod 2=0 then begin
    putpixel(x1,t,not getpixel(x1,t));
    putpixel(x2,t,not getpixel(x2,t));
  end;
  mshow;
end;

procedure drawline;
var t:integer;
begin
  if c3>=0 then begin
    setfillstyle(1,c3);
    bar(x1,y1,x2,y2);
  end;
  if wide>0 then
    for t:=1 to wide do begin
      setcolor(c1);
      line(x1-t,y1-t,x2+t,y1-t);
      line(x1-t,y1-t,x1-t,y2+t);
      setcolor(c2);
      line(x1-t,y2+t,x2+t,y2+t);
      line(x2+t,y1-t,x2+t,y2+t);
    end;
  if wide<0 then
    for t:=-1 downto wide do begin
      setcolor(c1);
      line(x1-t,y1-t,x2+t,y1-t);
      line(x1-t,y1-t,x1-t,y2+t);
      setcolor(c2);
      line(x1-t,y2+t,x2+t,y2+t);
      line(x2+t,y1-t,x2+t,y2+t);
    end;
  if wide=0 then begin
      setcolor(c1);
      line(x1,y1,x2,y1);
      line(x1,y1,x1,y2);
      setcolor(c2);
      line(x1,y2,x2,y2);
      line(x2,y1,x2,y2);
  end;
end;

{ PString }

function newstr;
var
  P: PString;
begin
  if a='' then p:=nil else
  begin
    GetMem(p,Length(a)+1);
    P^:=a;
  end;
  NewStr:= P;
end;

procedure disposestr;
begin
  if a<>nil then FreeMem(a, Length(a^) + 1);
end;

function lenstr;
begin
  if a=nil then lenstr:=0 else lenstr:=length(a^);
end;

procedure AddStr;
var c:string;
begin
  if a<>nil then c:=a^ else c:='';
  disposestr(a);
  c:=c+b;
  a:=newstr(c);
end;

procedure DeleteStr;
var c:string;
begin
  if a<>nil then c:=a^ else c:='';
  disposestr(a);
  delete(c,start,en);
  a:=newstr(c);
end;

function GetStrLink;
var p:PStrLink;
begin
  if a<>'' then begin
    new(p);
    p^.Data:=NewStr(a);
    p^.Next:=next;
  end else p:=next;
  GetStrLink:=p;
end;

procedure DisposeStrLink;
var r,q:PStrLink;
begin
  r:=p;
  while r<>nil do begin
    q:=r^.next;
    disposestr(r^.data);
    dispose(r);
    r:=q
  end;
end;

procedure SortStrLink;
  procedure InsertStrLink(var head:PStrLink;x:string);
  var po,p:PStrLink;
      t:PString;
  begin
    p:=getstrlink(^A,head);
    head:=p;
    po:=getstrlink(x,nil);
    p:=head;
    while (p^.data^<x) and (p^.next<>nil) do p:=p^.next;
    po^.next:=p^.next;
    p^.next:=po;
    if p^.data^>x then begin
      t:=po^.data;
      po^.data:=p^.data;
      p^.data:=t
    end;
    p:=head;
    head:=head^.next;
    p^.next:=nil;
    disposestrlink(p);
  end;
var p,q,r:PStrLink;
begin
  p:=head;
  if head<>nil then begin
    q:=head^.next;
    p^.next:=nil;
    while q<>nil do begin
      if q^.data<>nil then insertstrlink(p,q^.data^);
      r:=q;
      q:=q^.next;
      r^.next:=nil;
      disposestrlink(r);
    end;
  end;
  head:=p
end;

{ IO }

function DriveValid(Drive: Char):Boolean; assembler;
asm
	MOV	AH,19H          { Save the current drive in BL }
        INT	21H
        MOV	BL,AL
 	MOV	DL,Drive	{ Select the given drive }
        SUB	DL,'A'
        MOV	AH,0EH
        INT	21H
        MOV	AH,19H		{ Retrieve what DOS thinks is current }
        INT	21H
        MOV	CX,0		{ Assume false }
        CMP	AL,DL		{ Is the current drive the given drive? }
	JNE	@@1
        MOV	CX,1		{ It is, so the drive is valid }
	MOV	DL,BL		{ Restore the old drive }
        MOV	AH,0EH
        INT	21H
@@1:	XCHG	AX,CX		{ Put the return value into AX }
end;

function existfile;
var r:searchrec;
begin
  findfirst(filename,archive,r);
  existfile:=(doserror=0);
end;

function sizeoffile;
var f:searchrec;
begin
  findfirst(name,anyfile,f);
  if doserror=0 then sizeoffile:=f.size else sizeoffile:=0;
end;

function findfile;
var p,pa:string;
begin
  findfile:=name;
  if not existfile(name) then begin
    p:=getenv('path');
    while p<>'' do begin
      if p[length(p)]<>';' then p:=p+';';
      pa:=copy(p,1,pos(';',p)-1);
      delete(p,1,pos(';',p));
      if pa[length(pa)]<>'\' then pa:=pa+'\';
      if existfile(pa+name) then findfile:=pa+name;
    end;
  end;
end;

function getextname;
var t:integer;
    s:string;
begin
  s:='';
  for t:=length(name) downto 1 do if name[t]<>'.' then s:=upcase(name[t])+s else break;
  if t=1 then getextname:='' else getextname:=s;
end;

function getnameonly;
var t:integer;
    s:string;
begin
  s:='';
  for t:=length(name) downto 1 do if name[t]<>'\' then s:=s+upcase(name[t]) else break;
  delete(s,pos('.'+getextname(s),s),length(s));
  getnameonly:=s;
end;

function getfilenamedir;
var t:integer;
begin
  for t:=length(name) downto 1 do if not (name[t] in ['\',':']) then delete(name,t,1) else break;
  if name[length(name)]<>'\' then getfilenamedir:=name+'\' else getfilenamedir:=name;
end;

{ Useful }

function longstr;
var t:integer;
    b:string;
begin
  b:='';
  for t:=1 to l do b:=b+a;
  longstr:=b;
end;

function min;
begin
  if a>b then min:=b else min:=a;
end;

function max;
begin
  if a<b then max:=b else max:=a;
end;

function value;
var c,t:integer;
begin
  val(a,t,c);
  value:=t;
end;

function stri;
var s:string;
begin
  str(a,s);
  stri:=s
end;

function noblank;
var t:integer;
    b:string;
begin
  b:='';
  for t:=1 to length(a) do
    if a[t]<>' ' then b:=b+a[t];
  noblank:=b;
end;

function ValidValue;
begin
  if v>max then validvalue:=max else
  if v<min then validvalue:=min else
  validvalue:=v;
end;


end.