program class_Example;

// ! hello
Uses
   strings;

Type
   HookRec=Record
      Name:String;
      Value:TStringArray;
   End;
   TSlim=Class
      Version:String;
      Container:String;
      Apps:TStringArray;
      Name:String;
      Middleware:String;
      Error:String;
      notFound:String;
      hooks:Array [0..5] of HookRec;
      Mem:Pointer;
      MemSize:Longint;
   End;
   TNotSoSlim=Class(TSlim)
      AnotherVar:String;
   End;
   TSomeOther=Class
      Happy:Boolean;
      Name:String;
   End;

procedure TSlim.Free;
begin
   with Self do begin
      FreeMem(Mem, MemSize);
      Writeln('Free: ',MemSize);
   End;
end;

procedure TSlim.Init; // constructor does not need to be published.
begin
   with Self do begin
      MemSize:=2048;
      GetMem(Mem,MemSize);
      Container:='none';
      Version:='2.6.1p';
      hooks:=[ ['slim.before',[]],
              ['slim.before.router',[]],
              ['slim.before.dispatch',[]],
              ['slim.after.dispatch',[]],
              ['slim.after.router',[]],
              ['slim.after',[]] ];
      TMethod(@Free):=[@TSlim.Free, @Self];
   end;
end;

procedure TNotSoSlim.Free; override;
Begin
   inherited;
   Writeln('AnotherVar layer: ',AnotherVar);
end;

procedure TNotSoSlim.Init; override;
begin
   inherited;
   TMethod(@Free):=[@TNotSoSlim.Free, @Self];
end;

procedure TSomeOther.Free;
begin
   // nada
end;

procedure TSomeOther.Init;
begin
   Self.Happy:=True;
   TMethod(@Free):=[@TSomeOther.Free, @Self];
end;

var
   inst:TSlim;
   inst2:TSlim;
   inst3:TNotSoSlim;
   inst4:TSomeOther;

begin
   Writeln('Testing...',1,2,3,' ',4);
   inst.Init;
   inst2.Init;
   inst3.Init;
   inst4.Init;
   inst3.AnotherVar:="Cool!";
   inst2.Version:='3.0';
   Writeln('v',inst.Version);
   Writeln('v',inst2.Version);
   Writeln('v',inst3.Version);
   Writeln('cont:',inst.Container);
   Writeln('a:',inst3.AnotherVar);
   Writeln('h:',inst4.Happy);
   inst.Free;
   inst2.Free;
   inst3.Free;
   inst4.Free;
end.