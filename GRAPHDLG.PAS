{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Dialog Boxes                     }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

Unit GraphDlg;

interface

uses
  GraphObj, GraphDrv, GraphCon, GraphApp, Dos, GraphMnu, GraphCrt;

const
  cmButton1 = $FF01;
  cmButton2 = $FF02;
  cmButton3 = $FF03;
  cmUse     = $0201;

type PFileDialog=^TFileDialog;
     TFileDialog=object(TDialogBox)
       FileList:PListBox;
       FileNameBox:PInputBox;
       dir:String;
       ext:PList;
       path,size:PLabelX;
       constructor init(la:string;aext:PMenuItem);
       procedure UserEvent(var event:TEvent);virtual;
       function GetData:PStrLink;
       destructor done;virtual;
     end;

     PMouseDialog=^TMouseDialog;
     TMouseDialog=object(TDialogBox)
       VX,VY:PSlider;
       constructor init;
       procedure userevent(var event:TEvent);virtual;
       procedure process;
     end;

function MessageBox(message,la:string;buttons:word):integer;
function InputBox(message,la,de:string;m:integer;v:TValidChar):string;
function FileNameBox(la:string;ext:PMenuItem):string;
procedure MouseDialog;

implementation

procedure ChainStrLink(var p:PStrLink;q:PStrLink);
var r:PStrLink;
begin
  if p<>nil then begin
    r:=p;
    while r^.next<>nil do r:=r^.next;
    r^.next:=q;
  end else p:=q;
end;

function messagebox;
var d:PDialogBox;
    r:TRect;
    l,m,high:word;
    b1,b2,b3:PButton;
begin
  buttons:=validvalue(buttons,1,3);
  l:=min(max(max((length(message)+6)*charsize,(buttons*12+6)*charsize),lenlabel(la)),50*charsize);
  high:=16+(((length(message)-1) div 44)+5)*2*charsize;
  r.assign(320-l div 2,240-high div 2,320+l div 2,240+high div 2,2);
  d:=new(PDialogBox,init(r,$7F,la,true));
  r.assign(3*charsize,16+2*charsize,l-3*charsize,high-6*charsize,0);
  d^.insert(new(PLabelX,init(r,$70,message)));
  high:=high-4*charsize;
  case buttons mod 256 of
  1:begin
      r.assign(l div 2-3*charsize,high,0,0,2);
      b1:=New(PButton,init(r,' 确定 ',cmButton1,kbEnter,nil));
    end;
  2:begin
      m:=(l div 2-9*charsize) div 2;
      r.assign(m+3*charsize,high,0,0,2);
      b1:=New(PButton,init(r,' 确定 ',cmButton1,kbEnter,nil));
      r.assign(l div 2+m,high,0,0,2);
      b2:=new(PButton,init(r,' 取消 ',cmButton2,kbESC,nil));
    end;
  else begin
      m:=(l div 2-12*charsize) div 3;
      r.assign(m+3*charsize,high,0,0,2);
      b1:=new(PButton,init(r,'  是  ',cmButton1,kbAltY,nil));
      r.assign(m*3+9*charsize,high,0,0,2);
      b2:=new(PButton,init(r,' 不是 ',cmButton2,kbAltN,nil));
      r.assign(m*5+15*charsize,high,0,0,2);
      b3:=new(PButton,init(r,' 取消 ',cmButton3,kbAltC,nil));
    end;
  end;
  if buttons>2 then d^.insert(b3);
  if buttons>1 then d^.insert(b2);
  if buttons>0 then d^.insert(b1);
  d^.execute;
  messagebox:=d^.result;
  dispose(d,done);
end;

function Inputbox;
var d:PDialogBox;
    r:TRect;
    high:integer;
    i:PInputBox;
begin
  high:=(7+(length(message)-1) div 25+1)*2*charsize;
  r.assign(200,240-high div 2,440,240+high div 2,2);
  d:=new(PDialogBox,init(r,$7F,la,true));
  r.assign(20,4*charsize,220,high-10*charsize,0);
  d^.insert(new(PLabelX,init(r,$70,message)));
  high:=d^.bouns.b.y-4*charsize;
  r.assign(120-4*6,high,0,0,2);
  d^.insert(New(PButton,init(r,'  确定  ',cmButton1,kbEnter,nil)));
  r.assign(20,high-4*charsize,220,high-2*charsize,2);
  i:=New(PInputbox,init(r,m,de,$F0,v));
  i^.active:=true;
  d^.insert(i);
  d^.execute;
  if d^.result=0 then inputbox:='' else inputbox:=i^.gettext;
  dispose(d,done);
end;

constructor TFileDialog.init;
var r:TRect;
begin
  r.assign(200,120,440,360,2);
  TDialogBox.init(r,$7F,la,true);
  getdir(0,dir);
  if dir[length(dir)]<>'\' then dir:=dir+'\';
  r.assign(175,160,175+6*charsize,160+2*charsize,1);
  ext:=new(PList,init(r,$70,aext));
  insert(ext);
  r.assign(175,190,225,230,1);
  size:=new(PLabelX,init(r,$70,''));
  insert(size);
  r.assign(20,30,220,30+2*charsize,2);
  FileNameBox:=new(PInputBox,init(r,243,'',$F0,filenamechar));
  insert(FileNameBox);
  filenamebox^.active:=true;
  r.assign(20,100,160,230,1);
  FileList:=new(PListBox,init(r,$70,getdata,@Self));
  insert(FileList);
  r.assign(20,50,200,90,0);
  path:=new(PLabelX,init(R,$70,'路径:'+dir+'*.'+ext^.getcaption));
  insert(path);
  r.assign(204,60,0,0,2);
  insert(new(PButton,init(r,'$back.ico$',cmBackDir,kbBackSpace,nil)));
  r.assign(175,100,0,0,2);
  insert(new(PButton,init(r,' 确定 ',cmOK,kbEnter,@self)));
  r.assign(175,130,0,0,2);
  insert(new(PButton,init(r,' 取消 ',cmClose,kbEsc,@Self)));
end;

function TFileDialog.GetData;
var h:char;
    f:SearchRec;
    p,q,r:PStrlink;
begin
  p:=nil;
  q:=nil;
  r:=nil;
  for h:='Z' downto 'B' do if drivevalid(h) then p:=getstrlink(h+':',p);
  p:=getstrlink('A:',p);
  findfirst(dir+'*.*',directory,f);
  while doserror=0 do begin
    if f.attr=directory then q:=getstrlink(f.name+'\',q);
    findnext(f);
  end;
  findfirst(dir+'*.'+ext^.getcaption,archive,f);
  while doserror=0 do begin
    r:=getstrlink(f.name,r);
    findnext(f);
  end;
  sortstrlink(q);
  sortstrlink(r);
  chainstrlink(r,q);
  chainstrlink(r,p);
  getdata:=r;
end;

procedure TFileDialog.UserEvent;
var s:string;
    t:integer;
begin
  inherited userevent(event);
  if event.what=evCommand then case event.Command of
  cmListBoxSelect:
  begin
    s:=FileList^.GetCaption;
    case s[length(s)] of
      '\':if s='..\' then begin
        dir:=copy(dir,1,length(dir)-1);
        for t:=length(dir) downto 1 do if dir[t]<>'\' then dir:=copy(dir,1,t-1) else break;
        path^.changeto('路径:'+dir+'*.'+ext^.getcaption);
        filelist^.reinit(getdata);
      end else if s<>'.\' then begin
        dir:=dir+s;
        path^.changeto('路径:'+dir+'*.'+ext^.getcaption);
        filelist^.reinit(getdata);
      end;
      ':':begin
        dir:=s+'\';
        path^.changeto('路径:'+dir+'*.'+ext^.getcaption);
        filelist^.reinit(getdata);
      end;
      else begin
          FileNameBox^.ChangeTo(s);
          Size^.ChangeTo(stri(SizeOfFile(dir+s))+' 字节');
        end;
      end;
      ClearEvent(event);
    end;
  cmOK:
    if filenamebox^.text<>nil then begin
      event.command:=$FF01;
      event.ptr:=@Self;
    end;
  cmListChange:
    begin
      filelist^.reinit(getdata);
      path^.changeto('路径:'+dir+'*.'+ext^.getcaption);
    end;
  cmBackDir:
    begin
      if copy(path^.caption^,7,3)<>':\*' then begin
        dir:=copy(dir,1,length(dir)-1);
        for t:=length(dir) downto 1 do if dir[t]<>'\' then dir:=copy(dir,1,t-1) else break;
        path^.changeto('路径:'+dir+'*.'+ext^.getcaption);
        filelist^.reinit(getdata);
      end;
      clearevent(event);
    end;
  end;
end;

destructor TFileDialog.Done;
begin
  inherited done;
end;

function FileNameBox;
var d:PFileDialog;
begin
  d:=new(PFileDialog,init(la,ext));
  d^.execute;
  if d^.result=0 then filenamebox:='' else filenamebox:=d^.dir+d^.filenamebox^.text^;
  dispose(d,done);
end;

constructor TMouseDialog.init;
var r:TRect;
    reg:Registers;
begin
  r.assign(200,200,440,300,2);
  TDialogBox.init(r,$7F,'$mouse.ico$调整鼠标速度',true);
  insert(newlabel('水平移动速度',$70,10,25));
  insert(newlabel('垂直移动速度',$70,10,45));
  reg.ax:=$1b;
  intr($33,reg);
  r.assign(110,25,230,40,0);
  new(vx,init(r,$77,1,10,reg.bx div 10,nil));
  r.assign(110,45,230,60,0);
  new(vy,init(r,$77,1,10,reg.cx div 10,nil));
  insert(vx);
  insert(vy);
  r.assign(20,75,0,0,2);
  insert(new(PButton,init(r,' 确定 ',cmButton1,kbEnter,nil)));
  r.assign(80,75,0,0,2);
  insert(new(PButton,init(r,' 取消 ',cmClose,kbESC,nil)));
  r.assign(140,75,0,0,2);
  insert(new(PButton,init(r,' 应用 ',cmUse,kbNoKey,nil)));

end;

procedure TMouseDialog.userevent;
begin
  inherited userevent(event);
  if event.what=evCommand then if event.command=cmUse then process;
end;

procedure TMouseDialog.process;
var r:Registers;
begin
  r.ax:=$1A;
  r.bx:=vx^.vx*10;
  r.cx:=vy^.vx*10;
  intr($33,r);
end;

procedure MouseDialog;
var d:PMouseDialog;
begin
  new(d,init);
  d^.execute;
  if d^.result>0 then d^.process;
  dispose(d,done);
end;
end.