import { PrismaClient } from '@prisma/client';
import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';
import { Candidate } from '../domain/models/Candidate';
import { jest } from '@jest/globals';

// Mock the Candidate class
jest.mock('../domain/models/Candidate', () => {
  return {
    Candidate: jest.fn().mockImplementation((data) => {
      return {
        ...data,
        education: [],
        workExperience: [],
        resumes: [],
        save: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            id: 1,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            education: [],
            workExperience: [],
            resumes: []
          });
        })
      };
    })
  };
});

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    candidate: {
      create: jest.fn(),
      update: jest.fn()
    },
    education: {
      create: jest.fn()
    },
    workExperience: {
      create: jest.fn()
    },
    resume: {
      create: jest.fn()
    }
  }))
}));

describe('Candidate Management Tests', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient();
  });

  describe('Data Validation Tests', () => {
    test('should validate complete valid candidate data', () => {
      const validData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "albert.saelices@gmail.com",
        phone: "656874937",
        address: "Calle Sant Dalmir 2, 5ºB. Barcelona",
        educations: [{
          institution: "UC3M",
          title: "Computer Science",
          startDate: "2006-12-31",
          endDate: "2010-12-26"
        }],
        workExperiences: [{
          company: "Coca Cola",
          position: "SWE",
          description: "",
          startDate: "2011-01-13",
          endDate: "2013-01-17"
        }],
        cv: {
          filePath: "uploads/1715760936750-cv.pdf",
          fileType: "application/pdf"
        }
      };

      expect(() => validateCandidateData(validData)).not.toThrow();
    });

    test('should reject invalid email format', () => {
      const invalidData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "invalid-email",
        phone: "656874937"
      };

      expect(() => validateCandidateData(invalidData)).toThrow('Invalid email');
    });

    test('should reject invalid phone format', () => {
      const invalidData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "albert.saelices@gmail.com",
        phone: "123"
      };

      expect(() => validateCandidateData(invalidData)).toThrow('Invalid phone');
    });

    test('should validate education dates', () => {
      const invalidData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "albert.saelices@gmail.com",
        phone: "656874937",
        educations: [{
          institution: "UC3M",
          title: "Computer Science",
          startDate: "invalid-date",
          endDate: "2010-12-26"
        }]
      };

      expect(() => validateCandidateData(invalidData)).toThrow('Invalid date');
    });
  });

  describe('Database Operation Tests', () => {
    test('should successfully create a candidate with all fields', async () => {
      const candidateData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "albert.saelices@gmail.com",
        phone: "656874937",
        address: "Calle Sant Dalmir 2, 5ºB. Barcelona"
      };

      const result = await addCandidate(candidateData);
      
      expect(result).toHaveProperty('id');
      expect(result.firstName).toBe(candidateData.firstName);
    });

    test('should handle database errors gracefully', async () => {
      const candidateData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "albert.saelices@gmail.com"
      };

      // Mock implementation for this specific test
      (Candidate as jest.MockedClass<typeof Candidate>).mockImplementationOnce((data) => ({
        ...data,
        education: [],
        workExperience: [],
        resumes: [],
        save: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      }));

      await expect(addCandidate(candidateData)).rejects.toThrow('Database error');
    });

    test('should create related education records', async () => {
      const candidateData = {
        firstName: "Albert",
        lastName: "Saelices",
        email: "albert.saelices@gmail.com",
        educations: [{
          institution: "UC3M",
          title: "Computer Science",
          startDate: "2006-12-31",
          endDate: "2010-12-26"
        }]
      };

      // Mock implementation with education support
      (Candidate as jest.MockedClass<typeof Candidate>).mockImplementationOnce((data) => ({
        ...data,
        education: [],
        workExperience: [],
        resumes: [],
        save: jest.fn().mockResolvedValueOnce({
          id: 1,
          ...data,
          education: data.educations,
          workExperience: [],
          resumes: []
        })
      }));

      const result = await addCandidate(candidateData);
      
      expect(result).toHaveProperty('id');
      expect(result.education).toBeDefined();
      expect(result.education.length).toBe(1);
      expect(result.education[0].institution).toBe("UC3M");
    });
  });
}); 