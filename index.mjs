
// RDS Data Serviceの代わりにmysql2を使用
import mysql from 'mysql2/promise';

// 環境変数からデータベース接続設定を取得
const dbConfig = {
    host:'pasta-database.ct6cuoqys2nr.ap-northeast-1.rds.amazonaws.com',
    user: 'admin',
    password:'Qb6>Qa22(vbn)!mq2quz[eRX_*#I',
    database: 'pastaDatabase',
};

const db = mysql.createPool(dbConfig);


export const handler = async (event) => {
    
    try {
        const { httpMethod, pathParameters, body } = event;
        const playerId = pathParameters?.m_PlayerId;
        const path = event.path;
        
        console.log('Method:', httpMethod);
        console.log('Path:', path);
        console.log('PlayerId:', playerId);
        
        if (!playerId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Player ID is required' 
                })
            };
        }
        
        // パスによる条件分岐
        if (path.includes('/save') && httpMethod === 'POST') {
            return await handleSave(playerId, body);
        }
        else if (path.includes('/load') && httpMethod === 'GET') {
            return await handleLoad(playerId);
        }
        else if (path.includes('/reset') && httpMethod === 'POST') {
            return await handleReset(playerId, body);
        }
        
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                error: 'Method not allowed' 
            })
        };
        
    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};

// セーブ処理
async function handleSave(playerId, body) {
    
    
    try {
        console.log('=== handleSave called ===');
        console.log('PlayerId:', playerId);
        console.log('Body:', body);
        
        // const gameData = JSON.parse(body);
        
        // MySQL接続
        // console.log('🔄 Creating MySQL connection...');
        try {
            // const result = await db.query('SELECT 1 as test');
            // console.log(result);
            const [result] =await pool.query('INSERT INTO test_table (name, age) VALUES (?, ?)',
      [path, playerId]);
                
        }catch(error){
            console.error('MySQL connection error:', error);
        }
        
        console.log('✅ Connected to MySQL');
        
        // 接続テスト
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Game data saved successfully',
                data: {
                    playerId: playerId,
                    saveTime: new Date().toISOString(),
                }
            })
        };
        
    } catch (error) {
        console.error('Save error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to save game data',
                details: error.message
            })
        };
    }
}

// ロード処理
async function handleLoad(playerId) {
    let connection;
    
    try {
        console.log('=== handleLoad called ===');
        console.log('PlayerId:', playerId);
        
        // MySQL接続
        console.log('🔄 Creating MySQL connection...');
        connection = mysql.createConnection(dbConfig);
        
        // mysql接続
        await connection.connect();
        console.log('✅ Connected to MySQL');
        
        const sql = 'SELECT * FROM player_saves WHERE player_id = ?';
        const [rows] = await connection.query(sql, [playerId]);
        
        console.log('Query result:', rows);
        
        if (rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    error: 'No save data found for this player' 
                })
            };
        }
        
        const saveData = rows[0];
        
        // JSONフィールドをパース
        const gameData = {
            playerPosition: {
                x: saveData.player_position_x,
                y: saveData.player_position_y,
                z: saveData.player_position_z
            },
            playerHP: saveData.player_hp,
            maxHP: saveData.max_hp,
            plateItems: JSON.parse(saveData.plate_items || '[]'),
            pastaPositions: JSON.parse(saveData.pasta_positions || '[]'),
            platePositions: JSON.parse(saveData.plate_positions || '[]'),
            saveTime: saveData.save_time,
            saveVersion: saveData.save_version
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                data: gameData
            })
        };
        
    } catch (error) {
        console.error('Load error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to load game data',
                details: error.message
            })
        };
    } finally {
        if (connection) {
            await connection.end();
            console.log('MySQL connection closed');
        }
    }
}

// リセット処理
async function handleReset(playerId, body) {
    let connection;
    
    try {
        console.log('=== handleReset called ===');
        console.log('PlayerId:', playerId);
        
        // MySQL接続
        console.log('🔄 Creating MySQL connection...');
        connection = mysql.createConnection(dbConfig);
        
        // mysql接続
        await connection.connect();
        console.log('✅ Connected to MySQL');
        
        const sql = 'DELETE FROM player_saves WHERE player_id = ?';
        const [result] = await connection.query(sql, [playerId]);
        
        console.log('Reset result:', result);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Save data reset successfully',
                data: {
                    playerId: playerId,
                    affectedRows: result.affectedRows
                }
            })
        };
        
    } catch (error) {
        console.error('Reset error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to reset game data',
                details: error.message
            })
        };
    } finally {
        if (connection) {
            await connection.end();
            console.log('MySQL connection closed');
        }
    }
}












