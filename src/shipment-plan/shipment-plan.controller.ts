import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBody,
    ApiBearerAuth,
    ApiConsumes,
    ApiExtraModels,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ShipmentPlanExcelFile, ShipmentPlanService } from './shipment-plan.service';
import { ShipmentPlanExtractedRowDto } from './dto/shipment-plan-extracted-row.dto';
import { ShipmentPlanUploadResponseDto } from './dto/shipment-plan-upload-response.dto';

@ApiTags('Shipment Plan')
@Controller('shipment-plan')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(ShipmentPlanExtractedRowDto, ShipmentPlanUploadResponseDto)
export class ShipmentPlanController {
    constructor(private readonly shipmentPlanService: ShipmentPlanService) { }

    @Post('upload-excel')
    @ApiOperation({ summary: 'Upload shipment plan Excel file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Excel file uploaded and shipment plan persisted',
        type: ShipmentPlanUploadResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid file request' })
    @UseInterceptors(FileInterceptor('file'))
    uploadExcel(
        @UploadedFile() file: ShipmentPlanExcelFile,
    ): ReturnType<ShipmentPlanService['uploadExcel']> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        return this.shipmentPlanService.uploadExcel(file);
    }

}
