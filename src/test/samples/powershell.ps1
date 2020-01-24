# Convert any text file to ASCII

param( [string] $infile = $(throw "Please specify a filename.") ) 

$outfile = "$infile.ascii" 

get-content -path $infile | out-file $outfile -encoding ascii

# ! comment here
# ? another comment
# TODO: some other comment
# * highlighted comment

<# 
! hello world
* hello world
? hello world
#>