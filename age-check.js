// ===== 年齢確認 =====

(function() {
    // 既に確認済みならスキップ
    if (sessionStorage.getItem('ageVerified') === 'true') {
        return;
    }
    
    // 年齢確認モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'ageCheckModal';
    modal.innerHTML = `
        <div class="age-check-overlay"></div>
        <div class="age-check-content">
            <div class="age-check-icon">⚠️</div>
            <h2 class="age-check-title">年齢確認</h2>
            <p class="age-check-text">このサイトには成人向けコンテンツが含まれています。</p>
            <p class="age-check-question">あなたは18歳以上ですか？</p>
            <div class="age-check-buttons">
                <button id="ageYes" class="age-btn age-btn-yes">はい（18歳以上）</button>
                <button id="ageNo" class="age-btn age-btn-no">いいえ</button>
            </div>
        </div>
    `;
    
    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        #ageCheckModal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .age-check-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
        }
        
        .age-check-content {
            position: relative;
            background: linear-gradient(145deg, #fff 0%, #faf3eb 100%);
            border-radius: 20px;
            padding: 40px 50px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 450px;
            margin: 20px;
            border: 3px solid #c9a66b;
        }
        
        .age-check-icon {
            font-size: 4rem;
            margin-bottom: 15px;
        }
        
        .age-check-title {
            font-size: 1.8rem;
            color: #3d2314;
            margin-bottom: 20px;
            font-family: 'Zen Maru Gothic', sans-serif;
        }
        
        .age-check-text {
            color: #6b4423;
            margin-bottom: 10px;
            font-size: 1rem;
            line-height: 1.6;
        }
        
        .age-check-question {
            color: #3d2314;
            font-weight: 700;
            font-size: 1.2rem;
            margin-bottom: 30px;
        }
        
        .age-check-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .age-btn {
            padding: 14px 35px;
            border: none;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Zen Maru Gothic', sans-serif;
        }
        
        .age-btn-yes {
            background: linear-gradient(135deg, #8b5a2b 0%, #5c3a21 100%);
            color: white;
        }
        
        .age-btn-yes:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(92, 58, 33, 0.4);
        }
        
        .age-btn-no {
            background: #e8cdb5;
            color: #5c3a21;
        }
        
        .age-btn-no:hover {
            background: #d4a574;
        }
        
        @media (max-width: 500px) {
            .age-check-content {
                padding: 30px 25px;
            }
            
            .age-check-buttons {
                flex-direction: column;
            }
            
            .age-btn {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // ボタンイベント
    document.getElementById('ageYes').addEventListener('click', function() {
        sessionStorage.setItem('ageVerified', 'true');
        modal.remove();
    });
    
    document.getElementById('ageNo').addEventListener('click', function() {
        window.location.href = 'https://www.google.com';
    });
})();
