* ! Stata do-file carsdata.do written January 2009
* ? Create a text log file that stores the results
log using carsdata.txt, text replace
* Read in the Stata data set carsdata.dta
use carsdata.dta
* Describe the variables in the data set
describe
* List the dataset
list
* TODO: Provide summary statistics of the variables in the data set
summarize
* Provide an X,Y scatterplot with a regression line
twoway (scatter cars hhsize) (lfit cars hhsize)
* Save the preceding graph in a file in PNG (portable networks graphic) format
graph export carsdata.png
* Regress cars on hhsize
regress cars hhsize