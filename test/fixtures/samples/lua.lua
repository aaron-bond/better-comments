function entry0 (o)
    N=N + 1
    local title = o.title or '(no title)'
    fwrite('<LI><A HREF="#%d">%s</A>\n', N, title)
  end
  -- ! some comments

  --[[
  ! hello world
  --]]