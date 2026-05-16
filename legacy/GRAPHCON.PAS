{                                         }
{  Turbo Graph Runtime Library            }
{  Graph Const                            }
{                                         }
{  Copyright Song Studio                  }
{     2000,1                              }

Unit GraphCon;

interface

const
  evNothing  =0;
  evMouse    =1;
  evKey      =2;
  evCommand  =3;

const
  cmNoCommand    = $0000;
  cmClose        = $FF00;

  cmQuit         = $0001;
  cmOK           = $0002;
  cmNew          = $0003;
  cmOpen         = $0004;
  cmSave         = $0005;
  cmSaveAs       = $0006;
  cmUnDo         = $0007;
  cmExecute      = $0008;
  cmAbout        = $0009;
  cmReDrawDesktop= $000A;
  cmBackDir      = $000B;

  cmMoveBoxUp    = $0101;
  cmMoveBoxDown  = $0102;
  cmMoveBoxLeft  = $0103;
  cmMoveBoxRight = $0104;
  cmMoveBoxChange= $0105;
  cmProgressAdd  = $0111;
  cmProgressMin  = $0112;
  cmListOpen     = $0121;
  cmListChange   = $0122;
  cmListBoxSelect= $0131;
  cmNumBoxChange = $0141;
  cmMenuLeft     = $0151;
  cmMenuRight    = $0152;
  cmPageChange   = $0161;
  cmColorTableOpen=$0171;
  cmColor0       = $0180;
  cmColor1       = $0181;
  cmColor2       = $0182;
  cmColor3       = $0183;
  cmColor4       = $0184;
  cmColor5       = $0185;
  cmColor6       = $0186;
  cmColor7       = $0187;
  cmColor8       = $0188;
  cmColor9       = $0189;
  cmColorA       = $018A;
  cmColorB       = $018B;
  cmColorC       = $018C;
  cmColorD       = $018D;
  cmColorE       = $018E;
  cmColorF       = $018F;


const
  kbNoKey      =0;

  kbSA          =65;
  kbSB          =66;
  kbSC          =67;
  kbSD          =68;
  kbSE          =69;
  kbSF          =70;
  kbSG          =71;
  kbSH          =72;
  kbSI          =73;
  kbSJ          =74;
  kbSK          =75;
  kbSL          =76;
  kbSM          =77;
  kbSN          =78;
  kbSO          =79;
  kbSP          =80;
  kbSQ          =81;
  kbSR          =82;
  kbSS          =83;
  kbST          =84;
  kbSU          =85;
  kbSV          =86;
  kbSW          =87;
  kbSX          =88;
  kbSY          =89;
  kbSZ          =90;

const
  kbA         =97;
  kbB         =98;
  kbC         =99;
  kbD         =100;
  kbE         =101;
  kbF         =102;
  kbG         =103;
  kbH         =104;
  kbI         =105;
  kbJ         =106;
  kbK         =107;
  kbL         =108;
  kbM         =109;
  kbN         =110;
  kbO         =111;
  kbP         =112;
  kbQ         =113;
  kbR         =114;
  kbS         =115;
  kbT         =116;
  kbU         =117;
  kbV         =118;
  kbW         =119;
  kbX         =120;
  kbY         =121;
  kbZ         =122;

const
  kb0          =48;
  kb1          =49;
  kb2          =50;
  kb3          =51;
  kb4          =52;
  kb5          =53;
  kb6          =54;
  kb7          =55;
  kb8          =56;
  kb9          =57;

const
  kbCtrlA      =$01;
  kbCtrlB      =$02;
  kbCtrlC      =$03;
  kbCtrlD      =$04;
  kbCtrlE      =$05;
  kbCtrlF      =$06;
  kbCtrlG      =$07;
  kbCtrlH      =$08;
  kbCtrlI      =$09;
  kbCtrlJ      =$0A;
  kbCtrlK      =$0B;
  kbCtrlL      =$0C;
  kbCtrlM      =$0D;
  kbCtrlN      =$0E;
  kbCtrlO      =$0F;
  kbCtrlP      =$10;
  kbCtrlQ      =$11;
  kbCtrlR      =$12;
  kbCtrlS      =$13;
  kbCtrlT      =$14;
  kbCtrlU      =$15;
  kbCtrlV      =$16;
  kbCtrlW      =$17;
  kbCtrlX      =$18;
  kbCtrlY      =$19;
  kbCtrlZ      =$1A;

const
  kbAltQ       =256+16;
  kbAltW       =256+17;
  kbAltE       =256+18;
  kbAltR       =256+19;
  kbAltT       =256+20;
  kbAltY       =256+21;
  kbAltU       =256+22;
  kbAltI       =256+23;
  kbAltO       =256+24;
  kbAltP       =256+25;
  kbAltA       =256+30;
  kbAltS       =256+31;
  kbAltD       =256+32;
  kbAltF       =256+33;
  kbAltG       =256+34;
  kbAltH       =256+35;
  kbAltJ       =256+36;
  kbAltK       =256+37;
  kbAltL       =256+38;
  kbAltZ       =256+44;
  kbAltX       =256+45;
  kbAltC       =256+46;
  kbAltV       =256+47;
  kbAltB       =256+48;
  kbAltN       =256+49;
  kbAltM       =256+50;

const
  kbF1         =256+59;
  kbF2         =256+60;
  kbF3         =256+61;
  kbF4         =256+62;
  kbF5         =256+63;
  kbF6         =256+64;
  kbF7         =256+65;
  kbF8         =256+66;
  kbF9         =256+67;
  kbF10        =256+68;

const
  kbCtrlF1     =256+94;
  kbCtrlF2     =256+95;
  kbCtrlF3     =256+96;
  kbCtrlF4     =256+97;
  kbCtrlF5     =256+98;
  kbCtrlF6     =256+99;
  kbCtrlF7     =256+100;
  kbCtrlF8     =256+101;
  kbCtrlF9     =256+102;
  kbCtrlF10    =256+103;
  kbAltF1      =256+104;
  kbAltF2      =256+105;
  kbAltF3      =256+106;
  kbAltF4      =256+107;
  kbAltF5      =256+108;
  kbAltF6      =256+109;
  kbAltF7      =256+110;
  kbAltF8      =256+111;
  kbAltF9      =256+112;
  kbAltF10     =256+113;

const
  kbEnter      =13;
  kbESC        =27;
  kbBackSpace  =8;
  kbUp         =256+72;
  kbDown       =256+80;
  kbLeft       =256+75;
  kbRight      =256+77;
  kbHome       =256+71;
  kbEnd        =256+79;
  kbCtrlHome   =256+119;
  kbCtrlEnd    =256+117;
  kbCtrlLeft   =256+115;
  kbCtrlRight  =256+116;
  kbCtrlUp     =256+141;
  kbCtrlDown   =256+145;

implementation

end.