-- Script para corrigir grupos "Sistema" duplicados
-- Deve ser executado no banco de dados oco_db

-- 1. Identificar grupos "Sistema" duplicados
SELECT id, name, "monthYear", "createdAt" 
FROM budget_groups 
WHERE name = 'Sistema' 
ORDER BY "monthYear", "createdAt";

-- 2. Para cada mês, manter apenas o grupo "Sistema" mais antigo e mover categorias dos duplicados
DO $$ 
DECLARE
    month_year DATE;
    keep_group_id INT;
    duplicate_group_id INT;
    duplicate_record RECORD;
BEGIN
    -- Para cada monthYear que tem grupos Sistema duplicados
    FOR month_year IN 
        SELECT DISTINCT "monthYear" 
        FROM budget_groups 
        WHERE name = 'Sistema'
        GROUP BY "monthYear" 
        HAVING COUNT(*) > 1
    LOOP
        -- Encontrar o grupo mais antigo (primeiro criado) para manter
        SELECT id INTO keep_group_id 
        FROM budget_groups 
        WHERE name = 'Sistema' AND "monthYear" = month_year 
        ORDER BY "createdAt" ASC 
        LIMIT 1;
        
        RAISE NOTICE 'Mês %, mantendo grupo ID %', month_year, keep_group_id;
        
        -- Para cada grupo duplicado do mesmo mês
        FOR duplicate_record IN 
            SELECT id 
            FROM budget_groups 
            WHERE name = 'Sistema' 
              AND "monthYear" = month_year 
              AND id != keep_group_id
        LOOP
            duplicate_group_id := duplicate_record.id;
            RAISE NOTICE 'Removendo grupo duplicado ID %', duplicate_group_id;
            
            -- Mover todas as categorias do grupo duplicado para o grupo principal
            UPDATE budget_categories 
            SET "groupId" = keep_group_id 
            WHERE "groupId" = duplicate_group_id;
            
            -- Remover o grupo duplicado
            DELETE FROM budget_groups WHERE id = duplicate_group_id;
            
            RAISE NOTICE 'Grupo duplicado ID % removido', duplicate_group_id;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Limpeza de grupos Sistema duplicados concluída';
END $$;

-- 3. Verificar resultado final
SELECT id, name, "monthYear", "createdAt",
       (SELECT COUNT(*) FROM budget_categories WHERE "groupId" = budget_groups.id) as category_count
FROM budget_groups 
WHERE name = 'Sistema' 
ORDER BY "monthYear", "createdAt";