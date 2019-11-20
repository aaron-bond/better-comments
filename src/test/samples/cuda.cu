// CUDA Sample

// * header
#include <stdio.h>

#include "cuda_runtime.h"
#include "device_launch_parameters.h"

// comment samples:
// ! hello world
// * another comment
// ? and another

/* 
 ! block comments are the same 
*/

// * kernel
__global__ 
void helloFromGPU (void) 
{
    printf("Hello World from GPU!\n");
}

// * main
int main(int argc, char* argv[])
{
    // hello from cpu
    printf("Hello World from CPU!\n");

    // hello from gpu
    for(int i=0;i<1000;i++)
    {
        helloFromGPU <<<1, 100>>>();
        cudaDeviceReset();
    }
    
    return 0;
}
