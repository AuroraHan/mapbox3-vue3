//全国
export const fragmentShader = `
        uniform sampler2D colorTexture;  // 颜色纹理
        uniform sampler2D depthTexture;  // 深度纹理
        in vec2 v_textureCoordinates;  // 纹理坐标
        uniform float u_earthRadiusOnCamera;
        uniform float u_cameraHeight;
        uniform float u_fogHeight;
        uniform vec3 u_fogColor;
        uniform float u_globalDensity;

        // 通过深度纹理与纹理坐标得到世界坐标
        vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
            float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
            eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
            vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
            worldCoordinate = worldCoordinate / worldCoordinate.w;
            return worldCoordinate;
        }

        // 计算粗略的高程，依赖js传递的相机位置处的地球高程u_earthRadiusOnCamera。好处是计算量非常低
        float getRoughHeight(vec4 worldCoordinate) {
            float disToCenter = length(vec3(worldCoordinate));
            return disToCenter - u_earthRadiusOnCamera;
        }


        // 得到a向量在b向量的投影长度，如果同向结果为正，异向结果为复
        float projectVector(vec3 a, vec3 b) {
            float scale = dot(a, b) / dot(b, b);
            float k = scale / abs(scale);
            return k * length(scale * b);
        }

        // 线性浓度积分高度雾
        float linearHeightFog(vec3 positionToCamera, float cameraHeight, float pixelHeight, float fogMaxHeight) {
            float globalDensity = u_globalDensity / 10.0;
            vec3 up = -1.0 * normalize(czm_viewerPositionWC);
            float vh = projectVector(normalize(positionToCamera), up);
        
            // 让相机沿着视线方向移动 雾气产生距离 的距离
            float s = step(100.0, length(positionToCamera));
            vec3 sub = mix(positionToCamera, normalize(positionToCamera) * 100.0, s);
            positionToCamera -= sub;
            cameraHeight = mix(pixelHeight, cameraHeight - 100.0 * vh, s);
        
            float b = mix(cameraHeight, fogMaxHeight, step(fogMaxHeight, cameraHeight));
            float a = mix(pixelHeight, fogMaxHeight, step(fogMaxHeight, pixelHeight));
        
            float fog = (b - a) - 0.5 * (pow(b, 2.0) - pow(a, 2.0)) / fogMaxHeight;
            fog = globalDensity * fog / vh;
        
            if(abs(vh) <= 0.01 && cameraHeight < fogMaxHeight) {
                float disToCamera = length(positionToCamera);
                fog = globalDensity * (1.0 - cameraHeight / fogMaxHeight) * disToCamera;
            }
        
            fog = mix(0.0, 1.0, fog / (fog + 1.0));
        
            return fog;
        }


        void main(void) {
            vec4 color = texture(colorTexture, v_textureCoordinates);
            vec4 positionWC = getWorldCoordinate(depthTexture, v_textureCoordinates);
            float pixelHeight = getRoughHeight(positionWC);
            vec3 positionToCamera = vec3(vec3(positionWC) - czm_viewerPositionWC);
            float fog = linearHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
            out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog);
        }
`;

//一定范围内
export const fragmentShaderArea = `
        uniform sampler2D colorTexture;  // 颜色纹理
        uniform sampler2D depthTexture;  // 深度纹理
        in vec2 v_textureCoordinates;  // 纹理坐标
        uniform float u_earthRadiusOnCamera;
        uniform float u_cameraHeight;
        uniform float u_fogHeight;
        uniform vec3 u_fogColor;
        uniform float u_globalDensity;

        uniform vec3 u_fogCenter;  // 雾效中心点(世界坐标)
        uniform float u_fogRadius; // 雾效作用半径

        // 通过深度纹理与纹理坐标得到世界坐标
        vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
            float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
            eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
            vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
            worldCoordinate = worldCoordinate / worldCoordinate.w;
            return worldCoordinate;
        }

        // 计算粗略的高程，依赖js传递的相机位置处的地球高程u_earthRadiusOnCamera。好处是计算量非常低
        float getRoughHeight(vec4 worldCoordinate) {
            float disToCenter = length(vec3(worldCoordinate));
            return disToCenter - u_earthRadiusOnCamera;
        }


        // 得到a向量在b向量的投影长度，如果同向结果为正，异向结果为复
        float projectVector(vec3 a, vec3 b) {
            float scale = dot(a, b) / dot(b, b);
            float k = scale / abs(scale);
            return k * length(scale * b);
        }

        // 线性浓度积分高度雾
        float linearHeightFog(vec3 positionToCamera, float cameraHeight, float pixelHeight, float fogMaxHeight) {
            float globalDensity = u_globalDensity / 10.0;
            vec3 up = -1.0 * normalize(czm_viewerPositionWC);
            float vh = projectVector(normalize(positionToCamera), up);
        
            // 让相机沿着视线方向移动 雾气产生距离 的距离
            float s = step(100.0, length(positionToCamera));
            vec3 sub = mix(positionToCamera, normalize(positionToCamera) * 100.0, s);
            positionToCamera -= sub;
            cameraHeight = mix(pixelHeight, cameraHeight - 100.0 * vh, s);
        
            float b = mix(cameraHeight, fogMaxHeight, step(fogMaxHeight, cameraHeight));
            float a = mix(pixelHeight, fogMaxHeight, step(fogMaxHeight, pixelHeight));
        
            float fog = (b - a) - 0.5 * (pow(b, 2.0) - pow(a, 2.0)) / fogMaxHeight;
            fog = globalDensity * fog / vh;
        
            if(abs(vh) <= 0.01 && cameraHeight < fogMaxHeight) {
                float disToCamera = length(positionToCamera);
                fog = globalDensity * (1.0 - cameraHeight / fogMaxHeight) * disToCamera;
            }
        
            fog = mix(0.0, 1.0, fog / (fog + 1.0));
        
            return fog;
        }


        void main(void) {
            vec4 color = texture(colorTexture, v_textureCoordinates);
            vec4 positionWC = getWorldCoordinate(depthTexture, v_textureCoordinates);

            // 计算当前像素到雾效中心的距离 无平滑效果
            //float distanceToCenter = distance(vec3(positionWC), u_fogCenter);
            
            // 只在半径范围内应用雾效
            //if(distanceToCenter <= u_fogRadius) {
            //    float pixelHeight = getRoughHeight(positionWC);
            //    vec3 positionToCamera = vec3(vec3(positionWC) - czm_viewerPositionWC);
            //    float fog = linearHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
            //    out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog);
            //} else {
            //    out_FragColor = color; // 范围外保持原色
            //}

            //平滑效果
            float distanceToCenter = distance(vec3(positionWC), u_fogCenter);
            float fogFactor = 1.0 - smoothstep(u_fogRadius * 0.8, u_fogRadius, distanceToCenter);
    
            if(fogFactor > 0.0) {
                float pixelHeight = getRoughHeight(positionWC);
                vec3 positionToCamera = vec3(vec3(positionWC) - czm_viewerPositionWC);
                float fog = linearHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
                out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog * fogFactor);
            } else {
                out_FragColor = color;
            }
        }
`;
