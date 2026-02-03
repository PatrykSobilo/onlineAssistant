-- Dodaj pola do przechowywania kontekstu kategorii w dyskusjach

ALTER TABLE discussions 
ADD COLUMN note_category_id INT NULL,
ADD COLUMN note_sub_category_id INT NULL,
ADD COLUMN context_level INT DEFAULT 1 COMMENT 'Poziom w hierarchii (1-5)',
ADD CONSTRAINT fk_discussion_category 
  FOREIGN KEY (note_category_id) REFERENCES note_categories(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_discussion_subcategory 
  FOREIGN KEY (note_sub_category_id) REFERENCES note_sub_categories(id) ON DELETE SET NULL;

-- Dodaj indeksy dla lepszej wydajności
CREATE INDEX idx_discussions_category ON discussions(note_category_id);
CREATE INDEX idx_discussions_subcategory ON discussions(note_sub_category_id);
