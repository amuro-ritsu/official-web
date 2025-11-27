// ===== 年齢確認 =====

(function() {
    // 既に確認済みならスキップ
    if (localStorage.getItem('ageVerified') === 'true') {
        return;
    }
    
    // オーバーレイ作成
    const overlay = document.createElement('div');
    overlay.id = 'ageVerifyOverlay';
    overlay.innerHTML = `
        <div class="age-verify-modal">
            <div class="age-verify-icon">⚠️</div>
            <h2>年齢確認</h2>
            <p>このサイトには成人向けコンテンツが含まれています。</p>
            <p>あなたは18歳以上ですか？</p>
            <div class="age-verify-buttons">
                <button id="ageYes" class="age-btn age-yes">はい（18歳以上）</button>
                <button id="ageNo" class="age-btn age-no">いいえ（18歳未満）</button>
            </div>
        </div>
    `;
    
    // スタイル追加
    const style = document.createElement('style');
    style.textContent = `
        #ageVerifyOverlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Zen Maru Gothic', sans-serif;
        }
        
        .age-verify-modal {
            background: linear-gradient(145deg, #fff 0%, #faf3eb 100%);
            border-radius: 20px;
            padding: 40px 50px;
            text-align: center;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            border: 3px solid #c9a66b;
        }
        
        .age-verify-icon {
            font-size: 4rem;
            margin-bottom: 15px;
        }
        
        .age-verify-modal h2 {
            color: #3d2314;
            font-size: 1.8rem;
            margin-bottom: 20px;
        }
        
        .age-verify-modal p {
            color: #5c3a21;
            font-size: 1rem;
            line-height: 1.8;
            margin-bottom: 10px;
        }
        
        .age-verify-buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            justify-content: center;
        }
        
        .age-btn {
            padding: 15px 35px;
            font-size: 1.1rem;
            font-weight: 600;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
        }
        
        .age-yes {
            background: linear-gradient(135deg, #8b5a2b 0%, #5c3a21 100%);
            color: white;
        }
        
        .age-yes:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 20px rgba(92, 58, 33, 0.4);
        }
        
        .age-no {
            background: #e8cdb5;
            color: #5c3a21;
        }
        
        .age-no:hover {
            background: #d4a574;
        }
        
        @media (max-width: 500px) {
            .age-verify-modal {
                padding: 30px 25px;
            }
            
            .age-verify-buttons {
                flex-direction: column;
            }
            
            .age-btn {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    // はいボタン
    document.getElementById('ageYes').addEventListener('click', function() {
        localStorage.setItem('ageVerified', 'true');
        overlay.remove();
    });
    
    // いいえボタン
    document.getElementById('ageNo').addEventListener('click', function() {
        window.location.href = 'https://www.google.com';
    });
})();
