/**
 * Example Frontend Integration for Board Templates
 * 
 * This file shows how to integrate the board templates feature into your frontend
 */

// ============================================
// Type Definitions
// ============================================

interface BoardTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  userId?: string;
  isPublic: boolean;
  backgroundUrl?: string;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateLabel {
  id: string;
  name: string;
  color: string;
  templateId: string;
}

interface TemplateCard {
  id: string;
  name: string;
  description?: string;
  order: number;
  templateListId: string;
}

interface TemplateList {
  id: string;
  name: string;
  order: number;
  templateId: string;
  cards?: TemplateCard[];
}

interface BoardTemplateWithDetails extends BoardTemplate {
  lists: TemplateList[];
  labels?: TemplateLabel[];
}

// ============================================
// API Service Class
// ============================================

class TemplateService {
  private baseUrl = '/api';

  /**
   * Get all available templates
   */
  async getAllTemplates(category?: string): Promise<BoardTemplate[]> {
    const url = category 
      ? `${this.baseUrl}/templates?category=${category}` 
      : `${this.baseUrl}/templates`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    return response.json();
  }

  /**
   * Get template details with lists, cards, and labels
   */
  async getTemplateById(templateId: string): Promise<BoardTemplateWithDetails> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch template details');
    }

    return response.json();
  }

  /**
   * Create a new board from a template
   */
  async createBoardFromTemplate(
    templateId: string,
    boardName: string,
    includeCards: boolean = true
  ) {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/create-board`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        boardName,
        includeCards,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create board from template');
    }

    return response.json();
  }

  /**
   * Save an existing board as a template
   */
  async saveBoardAsTemplate(
    boardId: string,
    templateName: string,
    templateDescription?: string,
    category?: string,
    isPublic: boolean = false
  ) {
    const response = await fetch(`${this.baseUrl}/templates/from-board/${boardId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        templateName,
        templateDescription,
        category,
        isPublic,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save board as template');
    }

    return response.json();
  }

  /**
   * Create a custom template
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    backgroundUrl?: string;
    backgroundColor?: string;
    lists: Array<{
      name: string;
      order: number;
      cards?: Array<{
        name: string;
        description?: string;
        order: number;
      }>;
    }>;
    labels?: Array<{
      name: string;
      color: string;
    }>;
  }) {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create template');
    }

    return response.json();
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
      backgroundUrl?: string;
      backgroundColor?: string;
    }
  ) {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update template');
    }

    return response.json();
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string) {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }

    return response.json();
  }

  private getAuthToken(): string {
    // Replace with your actual auth token retrieval logic
    return localStorage.getItem('authToken') || '';
  }
}

// ============================================
// React Component Examples
// ============================================

/**
 * Example: Template Gallery Component
 */
/*
function TemplateGallery() {
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const templateService = new TemplateService();

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      const data = await templateService.getAllTemplates(selectedCategory);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateBoard = async (templateId: string) => {
    const boardName = prompt('Enter board name:');
    if (!boardName) return;

    try {
      const board = await templateService.createBoardFromTemplate(
        templateId,
        boardName,
        true
      );
      // Navigate to the new board
      window.location.href = `/boards/${board.id}`;
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  return (
    <div className="template-gallery">
      <h2>Choose a Template</h2>
      
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="business">Business</option>
        <option value="engineering">Engineering</option>
        <option value="marketing">Marketing</option>
        <option value="design">Design</option>
        <option value="education">Education</option>
        <option value="personal">Personal</option>
      </select>

      <div className="template-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card">
            <div 
              className="template-preview" 
              style={{ backgroundColor: template.backgroundColor }}
            />
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <button onClick={() => handleCreateBoard(template.id)}>
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
*/

/**
 * Example: Save Board as Template Component
 */
/*
function SaveAsTemplateButton({ boardId }: { boardId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'business',
    isPublic: false,
  });
  const templateService = new TemplateService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await templateService.saveBoardAsTemplate(
        boardId,
        formData.name,
        formData.description,
        formData.category,
        formData.isPublic
      );
      alert('Board saved as template!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Save as Template
      </button>

      {isOpen && (
        <div className="modal">
          <form onSubmit={handleSubmit}>
            <h2>Save Board as Template</h2>
            
            <input
              type="text"
              placeholder="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="business">Business</option>
              <option value="engineering">Engineering</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design</option>
              <option value="education">Education</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>

            <label>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              Make this template public
            </label>

            <button type="submit">Save Template</button>
            <button type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </>
  );
}
*/

export { TemplateService };
export type { 
  BoardTemplate, 
  BoardTemplateWithDetails, 
  TemplateLabel, 
  TemplateList, 
  TemplateCard 
};
