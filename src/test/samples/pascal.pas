{$mode objfpc}{$H+}{$J-}
unit AnotherUnit;
interface

uses Classes;

{ The "TComponent" type (class) is defined in the Classes unit.
  That's why we had to use the Classes unit above. }
procedure DoSomethingWithComponent(var C: TComponent);

implementation

// ! hello world
uses SysUtils;

procedure DoSomethingWithComponent(var C: TComponent);
begin
  { The FreeAndNil procedure is defined in the SysUtils unit.
    Since we only refer to it's name in the implementation,
    it was OK to use the SysUtils unit in the "implementation" section. }
  FreeAndNil(C);
end;

end.