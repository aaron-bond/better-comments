#
#
#           The Nim Compiler
#        (c) Copyright 2015 Andreas Rumpf
#
#    See the file "copying.txt", included in this
#    distribution, for details about the copyright.
#

# * adding some sample comments for better-comments
when defined(gcc) and defined(windows):
  when defined(x86):
    {.link: "icons/nim.res".}
  else:
    {.link: "icons/nim_icon.o".}

#[
  ? question
  block comment
]#

when defined(amd64) and defined(windows) and defined(vcc):
  {.link: "icons/nim-amd64-windows-vcc.res".}
when defined(i386) and defined(windows) and defined(vcc):
  {.link: "icons/nim-i386-windows-vcc.res".}

import
  commands, lexer, condsyms, options, msgs, nversion, nimconf, ropes,
  extccomp, strutils, os, osproc, platform, main, parseopt, service,
  nodejs, scriptconfig, idents, modulegraphs

# ? adding some sample comments for better-comments
when hasTinyCBackend:
  import tccgen

when defined(profiler) or defined(memProfiler):
  {.hint: "Profiling support is turned on!".}
  import nimprof

proc prependCurDir(f: string): string =
  when defined(unix):
    if os.isAbsolute(f): result = f
    else: result = "./" & f
  else:
    result = f

# ! adding some sample comments for better-comments
proc handleCmdLine(cache: IdentCache; config: ConfigRef) =
  if paramCount() == 0:
    writeCommandLineUsage()
  else:
    # Process command line arguments:
    processCmdLine(passCmd1, "")
    if gProjectName == "-":
      gProjectName = "stdinfile"
      gProjectFull = "stdinfile"
      gProjectPath = canonicalizePath getCurrentDir()
      gProjectIsStdin = true
    elif gProjectName != "":
      try:
        gProjectFull = canonicalizePath(gProjectName)
      except OSError:
        gProjectFull = gProjectName
      let p = splitFile(gProjectFull)
      let dir = if p.dir.len > 0: p.dir else: getCurrentDir()
      gProjectPath = canonicalizePath dir
      gProjectName = p.name
    else:
      gProjectPath = canonicalizePath getCurrentDir()
    loadConfigs(DefaultConfig, config) # load all config files
    let scriptFile = gProjectFull.changeFileExt("nims")
    if fileExists(scriptFile):
      runNimScript(cache, scriptFile, freshDefines=false, config)
      # 'nim foo.nims' means to just run the NimScript file and do nothing more:
      if scriptFile == gProjectFull: return
    elif fileExists(gProjectPath / "config.nims"):
      # directory wide NimScript file
      runNimScript(cache, gProjectPath / "config.nims", freshDefines=false, config)
    # now process command line arguments again, because some options in the
    # command line can overwite the config file's settings
    extccomp.initVars()
    processCmdLine(passCmd2, "")
    if options.command == "":
      rawMessage(errNoCommand, command)
    mainCommand(newModuleGraph(config), cache)
    if optHints in gOptions and hintGCStats in gNotes: echo(GC_getStatistics())
    #echo(GC_getStatistics())
    if msgs.gErrorCounter == 0:
      when hasTinyCBackend:
        if gCmd == cmdRun:
          tccgen.run(commands.arguments)
      if optRun in gGlobalOptions:
        if gCmd == cmdCompileToJS:
          var ex: string
          if options.outFile.len > 0:
            ex = options.outFile.prependCurDir.quoteShell
          else:
            ex = quoteShell(
              completeCFilePath(changeFileExt(gProjectFull, "js").prependCurDir))
          execExternalProgram(findNodeJs() & " " & ex & ' ' & commands.arguments)
        elif gCmd == cmdCompileToPHP:
          var ex: string
          if options.outFile.len > 0:
            ex = options.outFile.prependCurDir.quoteShell
          else:
            ex = quoteShell(
              completeCFilePath(changeFileExt(gProjectFull, "php").prependCurDir))
          execExternalProgram("php " & ex & ' ' & commands.arguments)
        else:
          var binPath: string
          if options.outFile.len > 0:
            # If the user specified an outFile path, use that directly.
            binPath = options.outFile.prependCurDir
          else:
            # Figure out ourselves a valid binary name.
            binPath = changeFileExt(gProjectFull, ExeExt).prependCurDir
          var ex = quoteShell(binPath)
          execExternalProgram(ex & ' ' & commands.arguments)

# TODO adding some sample comments for better-comments
when declared(GC_setMaxPause):
  GC_setMaxPause 2_000

when compileOption("gc", "v2") or compileOption("gc", "refc"):
  # the new correct mark&sweet collector is too slow :-/
  GC_disableMarkAndSweep()
condsyms.initDefines()

# // adding some sample comments for better-comments
when not defined(selftest):
  handleCmdLine(newIdentCache(), newConfigRef())
  when declared(GC_setMaxPause):
    echo GC_getStatistics()
  msgQuit(int8(msgs.gErrorCounter > 0))
