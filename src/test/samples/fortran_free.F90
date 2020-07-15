program circle
implicit none
real :: r, area
real, parameter :: pi = acos(-1.0)

!* This program reads a real number r and prints
!* the area of a circle with radius r.
!TODO: pass a default value to r

print*, 'Give radius r:'

read  (*,*) r
!? Is this comparison okay?
!! yes, in Fortran it is
if ( r < 0.0 ) then
    print*, "Input a positive radius"
    stop
end if

! Calculate the area
area = pi*r**2
print*, 'Area = ', area

end program circle