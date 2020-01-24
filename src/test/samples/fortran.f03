program circle
      real r, area
 
c ! This program reads a real number r and prints
c * the area of a circle with radius r.
 
      write (*,*) 'Give radius r:'
      read  (*,*) r
      area = 3.14159*r*r
      write (*,*) 'Area = ', area
 
      stop
      end