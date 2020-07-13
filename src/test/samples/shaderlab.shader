// colored vertex lighting
Shader "Simple colored lighting"
{
    // a single color property
    Properties {
        _Color ("Main Color", Color) = (1,.5,.5,1)
    }
    
    // define one subshader
    SubShader
    {
        // a single pass in our subshader
        Pass
        {
            // use fixed function per-vertex lighting
            // ! this is an alert
            // ? this is a question
            // * this is a highlight
            //// this code has been removed
            // todo clean up removed code
            Material
            {
                Diffuse [_Color]
            }
            Lighting On
        }
    }
}