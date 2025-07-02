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

//正方形
export const fragmentShaderBox = `
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        in vec2 v_textureCoordinates;
        uniform float u_earthRadiusOnCamera;
        uniform float u_cameraHeight;
        uniform float u_fogHeight;
        uniform vec3 u_fogColor;
        uniform float u_globalDensity;
        uniform vec3 u_fogCenter;
        uniform float u_fogHalfSize;

        // 计算世界坐标
        vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
            float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
            eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
            vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
            worldCoordinate = worldCoordinate / worldCoordinate.w;
            return worldCoordinate;
        }

        // 计算粗略高度
        float getRoughHeight(vec4 worldCoordinate) {
            float disToCenter = length(vec3(worldCoordinate));
            return disToCenter - u_earthRadiusOnCamera;
        }

        // 计算局部坐标系方向
        void computeLocalFrame(vec3 position, out vec3 east, out vec3 north, out vec3 up) {
            up = normalize(position);
            vec3 tmp = abs(up.x) > 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
            east = normalize(cross(tmp, up));
            north = cross(up, east);
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
            vec3 worldPos = vec3(positionWC);
            
            // 计算局部坐标系
            vec3 east, north, up;
            computeLocalFrame(u_fogCenter, east, north, up);
            
            // 计算相对于中心点的偏移量
            vec3 offset = worldPos - u_fogCenter;
            
            // 计算在局部坐标系中的投影距离
            float eastDist = abs(dot(offset, east));
            float northDist = abs(dot(offset, north));
            
            // 判断是否在正方形区域内
            bool inSquare = (eastDist <= u_fogHalfSize) && (northDist <= u_fogHalfSize);
            
            if(inSquare) {
                float pixelHeight = getRoughHeight(positionWC);
                vec3 positionToCamera = worldPos - czm_viewerPositionWC;
                float fog = linearHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
                out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog);
            } else {
                out_FragColor = color;
            }
        }
`;

export const fragmentShaderGas = `
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        in vec2 v_textureCoordinates;
        uniform float u_earthRadiusOnCamera;
        uniform float u_cameraHeight;
        uniform vec3 u_gasCenter;          // 污染源中心
        uniform float u_maxRadius;          // 最大影响半径
        uniform float u_heightFalloff;      // 高度衰减系数
        uniform vec3 u_maxConcentrationColor; // 高浓度颜色（如深红）
        uniform vec3 u_minConcentrationColor; // 低浓度颜色（如浅黄）

        // 计算世界坐标
        vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
            float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
            eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
            vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
            worldCoordinate = worldCoordinate / worldCoordinate.w;
            return worldCoordinate;
        }

        // 计算粗略高度
        float getRoughHeight(vec4 worldCoordinate) {
            float disToCenter = length(vec3(worldCoordinate));
            return disToCenter - u_earthRadiusOnCamera;
        }

        // 计算局部坐标系方向
        void computeLocalFrame(vec3 position, out vec3 east, out vec3 north, out vec3 up) {
            up = normalize(position);
            vec3 tmp = abs(up.x) > 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
            east = normalize(cross(tmp, up));
            north = cross(up, east);
        }

        // 新版浓度计算函数
        float calculateConcentration(vec3 worldPos, float pixelHeight) {
            // 计算到中心的水平距离
            vec3 offset = worldPos - u_gasCenter;
            vec3 east, north, up;
            computeLocalFrame(u_gasCenter, east, north, up);
            float horizontalDist = sqrt(pow(dot(offset, east), 2.0) + pow(dot(offset, north), 2.0));
            
            // 计算高度衰减（气体随高度扩散）
            float heightFactor = exp(-pixelHeight / u_heightFalloff);
            
            // 计算浓度（距离衰减+高度衰减）
            float distanceFactor = 1.0 - smoothstep(0.0, u_maxRadius, horizontalDist);
            return distanceFactor * heightFactor;
        }

        void main(void) {
            vec4 color = texture(colorTexture, v_textureCoordinates);
            vec4 positionWC = getWorldCoordinate(depthTexture, v_textureCoordinates);
            vec3 worldPos = vec3(positionWC);
            
            // 计算当前像素高度
            float pixelHeight = getRoughHeight(positionWC);
            
            // 计算浓度值（0~1）
            float concentration = calculateConcentration(worldPos, pixelHeight);
            
            if(concentration > 0.01) {
                // 颜色映射：根据浓度插值
                vec3 gasColor = mix(u_minConcentrationColor, u_maxConcentrationColor, 
                                sqrt(concentration)); // 使用sqrt使过渡更自然
                
                // 混合原始场景（保留50%背景可见度）
                out_FragColor = mix(color, vec4(gasColor, 1.0), concentration );
            } else {
                out_FragColor = color;
            }
        }

`;
