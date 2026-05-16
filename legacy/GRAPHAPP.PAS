{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Application                      }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

Unit GraphApp;

Interface

Uses
  Graph,GraphDrv,GraphObj,CrtA,Dos,GraphCon;

Type
  TGraphApp = object
    Desktop:PDesktop;
    constructor Init;
    procedure SetDefault;virtual;
    procedure InitObjects;virtual;
    procedure run;virtual;
    procedure HandleEvent(var event:TEvent);virtual;
    procedure AlwaysDo;virtual;
    function CanQuit:boolean;virtual;
    procedure DoLeft;virtual;
    procedure DoRight;virtual;
    destructor Done;
  end;

Implementation

constructor TGraphApp.Init;
var r:TRect;
begin
  setdefault;
  InitAll;
  desktop:=new(PDesktop,init(desktopcolor));
  desktop^.insert(new(PHotKey,init(cmQuit,kbAltQ)));
  desktop^.insert(new(PHotKey,init(cmReDrawDesktop,kbCtrlF10)));
  desktop^.draw;
  initobjects;
end;

procedure TGraphApp.SetDefault;
begin
  ICGName:='TurboGRH.ICG';
  littlechar:=false;
  desktopcolor:=$70;
  EnableMouseKey:=false;
end;

procedure TGraphApp.InitObjects;
begin
end;

procedure TGraphApp.Run;
var event:TEvent;
begin
  desktop^.drawall;
  repeat
    GetEvent(event,true);
    HandleEvent(event);
    AlwaysDo;
  until finish;
end;

procedure TGraphApp.HandleEvent;
begin
  case event.what of
  evCommand:
    if (event.command<$100) and (event.command in disabledcommand) then clearevent(event) else
    case event.command of
    cmQuit:begin
             Finish:=CanQuit;
             clearevent(event);
           end;
    cmReDrawDesktop:
          begin
            desktop^.drawall;
            clearevent(event);
          end;
    end;
  end;
  Desktop^.HandleEvent(event);
end;

function TGraphApp.CanQuit;
begin
  CanQuit:=true;
end;

destructor TGraphApp.done;
begin
  dispose(desktop,done);
  CloseAll;
end;

procedure TGraphApp.DoLeft;
begin
end;

procedure TGraphApp.DoRight;
begin
end;

procedure TGraphApp.AlwaysDo;
begin
end;

End.