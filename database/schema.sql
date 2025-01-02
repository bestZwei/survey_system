CREATE DATABASE IF NOT EXISTS survey_system;
USE survey_system;

-- 用户表
CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user';

-- 问卷表
CREATE TABLE surveys (
  survey_id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 问题表
CREATE TABLE questions (
  question_id VARCHAR(36) PRIMARY KEY,
  survey_id VARCHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'RATING') NOT NULL,
  question_order INT NOT NULL,
  required BOOLEAN DEFAULT false,
  FOREIGN KEY (survey_id) REFERENCES surveys(survey_id) ON DELETE CASCADE
);

-- 选项表
CREATE TABLE options (
  option_id VARCHAR(36) PRIMARY KEY,
  question_id VARCHAR(36) NOT NULL,
  option_text TEXT NOT NULL,
  option_order INT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- 回答表
CREATE TABLE responses (
  response_id VARCHAR(36) PRIMARY KEY,
  survey_id VARCHAR(36) NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  answer_text TEXT,
  option_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(survey_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(option_id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX idx_survey_creator ON surveys(creator_id);
CREATE INDEX idx_question_survey ON questions(survey_id);
CREATE INDEX idx_option_question ON options(question_id);
CREATE INDEX idx_response_survey ON responses(survey_id);
CREATE INDEX idx_response_user ON responses(user_id);
CREATE INDEX idx_response_question ON responses(question_id);
CREATE INDEX idx_response_created_at ON responses(created_at);
